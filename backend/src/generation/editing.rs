//! Original DOE single-page authoring adapter; storage owns the atomic revision fence.
use crate::projects::SessionSchemaDeck;
use doe_document::presentation::{edit::Snapshot, schema::markdown};
use serde::Deserialize;
use serde_json::{Value, json};
use std::collections::HashMap;

#[derive(Default)]
pub struct Reads {
    snapshots: HashMap<String, Snapshot>,
    count: usize,
    bytes: usize,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Locator {
    page_number: Option<usize>,
    slide_id: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct EditInput {
    slide_id: String,
    expected_revision: u64,
    markdown: String,
}

impl Reads {
    pub fn read(&mut self, deck: &SessionSchemaDeck, input: Value) -> Result<Value, String> {
        let input: Locator = serde_json::from_value(input)
            .map_err(|_| "ReadSlide accepts page_number and/or slide_id only")?;
        if self.count >= 8 || self.bytes >= 160_000 {
            return Err("ReadSlide budget exhausted; reuse current saved-page receipts".into());
        }
        let slides = deck.deck["deck"]["slides"]
            .as_array()
            .ok_or("No saved slides exist")?;
        let by_page = input
            .page_number
            .map(|number| {
                number
                    .checked_sub(1)
                    .filter(|index| *index < slides.len())
                    .ok_or("page_number is outside the saved deck")
            })
            .transpose()?;
        let by_id = input
            .slide_id
            .as_ref()
            .map(|id| {
                slides
                    .iter()
                    .position(|slide| slide["id"] == *id)
                    .ok_or("slide_id is absent from the saved deck")
            })
            .transpose()?;
        if by_page.is_some() && by_id.is_some() && by_page != by_id {
            return Err("page_number and slide_id must identify the same saved page".into());
        }
        let index = by_page.or(by_id).ok_or("Supply page_number or slide_id")?;
        let slide = &slides[index];
        let snapshot = Snapshot {
            slide_id: slide["id"]
                .as_str()
                .ok_or("Saved page has no stable identity")?
                .into(),
            page_number: (index + 1) as i64,
            slide_count: slides.len() as i64,
            revision: i64::try_from(deck.revision).map_err(|_| "Saved revision is invalid")?,
            slide: slide.clone(),
            shared: json!({"title":deck.deck["deck"]["title"],"theme":deck.deck["deck"]["theme"],"pageNumber":deck.deck["pageNumber"]}),
            authoring_markdown: None,
        };
        let source = snapshot.authoring_source()?;
        let result = json!({"slideId":snapshot.slide_id,"pageNumber":snapshot.page_number,"slideCount":snapshot.slide_count,"revision":snapshot.revision,"markdown":source});
        let size = result.to_string().len();
        if self.bytes + size > 240_000 {
            return Err("ReadSlide response exceeds the source read budget".into());
        }
        self.bytes += size;
        self.count += 1;
        self.snapshots.insert(snapshot.slide_id.clone(), snapshot);
        Ok(result)
    }

    pub fn prepare(
        &self,
        deck: &SessionSchemaDeck,
        input: Value,
    ) -> Result<(Value, String), String> {
        let input: EditInput = serde_json::from_value(input).map_err(|_| "EditSlide requires slide_id, expected_revision and complete one-page markdown only")?;
        if input.markdown.len() > 2 * 1024 * 1024 {
            return Err("Slide Markdown exceeds the authoring limit".into());
        }
        let snapshot = self
            .snapshots
            .get(&input.slide_id)
            .ok_or("ReadSlide must read the current saved page before EditSlide")?;
        if input.expected_revision != deck.revision || snapshot.revision as u64 != deck.revision {
            return Err(
                "The saved deck revision changed. ReadSlide again; never repeat a committed edit"
                    .into(),
            );
        }
        let index = deck.deck["deck"]["slides"]
            .as_array()
            .and_then(|slides| {
                slides
                    .iter()
                    .position(|slide| slide["id"] == input.slide_id)
            })
            .ok_or("The saved page no longer exists")?;
        if deck.deck["deck"]["slides"][index] != snapshot.slide {
            return Err("The saved page changed. ReadSlide again before editing".into());
        }
        let candidate = markdown::prepare_edit(snapshot, json!({"markdown":input.markdown}))
            .map_err(|error| format!("{error:?}"))?;
        let mut result = deck.deck.clone();
        result["deck"]["slides"][index] = candidate;
        Ok((result, input.slide_id))
    }
}

pub fn theme(deck: &SessionSchemaDeck, input: Value) -> Result<Value, String> {
    #[derive(Deserialize)]
    #[serde(deny_unknown_fields)]
    struct Input {
        theme: String,
        expected_revision: u64,
    }
    let input: Input = serde_json::from_value(input)
        .map_err(|_| "SetDeckTheme requires theme and expected_revision only")?;
    if input.expected_revision != deck.revision {
        return Err("The deck revision changed. ReadOutline before selecting a theme".into());
    }
    if !doe_document::presentation::schema::contract::registered_theme_ids().contains(&input.theme)
    {
        return Err("Choose an exact registered theme id".into());
    }
    let mut result = deck.deck.clone();
    result["deck"]["theme"] = json!(input.theme);
    Ok(result)
}

pub fn inventory(deck: &SessionSchemaDeck) -> Value {
    let pages = deck.deck["deck"]["slides"].as_array().into_iter().flatten().enumerate().map(|(index, slide)| {
        let mut headline = String::new();
        let mut components = Vec::new();
        inventory_nodes(&slide["blocks"], &mut headline, &mut components);
        json!({"slideId":slide["id"],"pageNumber":index+1,"headline":headline,"components":components})
    }).collect::<Vec<_>>();
    json!({"revision":deck.revision,"theme":deck.deck["deck"]["theme"],"pages":pages,"inventory_note":"Saved source overview, not a rendered preview. ReadSlide for each page you need to edit. Source settings do not prove rendered layout."})
}

fn inventory_nodes(nodes: &Value, headline: &mut String, components: &mut Vec<Value>) {
    for node in nodes.as_array().into_iter().flatten() {
        let kind = node["type"].as_str().unwrap_or("");
        if headline.is_empty() && matches!(kind, "heading" | "hero") {
            if let Some(text) = node["props"]["text"]
                .as_str()
                .or_else(|| node["props"]["title"].as_str())
            {
                *headline = text.chars().take(160).collect();
            }
        }
        if !matches!(kind, "layout-group" | "heading" | "text" | "") && components.len() < 12 {
            components.push(json!({"type":kind}));
        }
        inventory_nodes(&node["children"], headline, components);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn saved() -> SessionSchemaDeck {
        let source = "title=Source\ntheme=yrkie-atelier\n# slide\n## section-heading\ntext=Original headline\n## text-paragraph\n### text\nKeep this body.\n# slide\n## section-heading\ntext=Untouched page\n## text-paragraph\n### text\nKeep all other pages.";
        SessionSchemaDeck {
            session_id: "fixture".into(),
            status: "active".into(),
            revision: 4,
            created_at: String::new(),
            updated_at: String::new(),
            deck: markdown::compile(source, &[]).unwrap().value,
        }
    }

    #[test]
    fn bound_edit_requires_read_and_preserves_other_pages_and_stable_ids() {
        let saved = saved();
        let mut reads = Reads::default();
        let id = saved.deck["deck"]["slides"][0]["id"].as_str().unwrap();
        assert!(
            reads
                .prepare(
                    &saved,
                    json!({"slide_id":id,"expected_revision":4,"markdown":"# slide"})
                )
                .is_err()
        );
        let receipt = reads
            .read(&saved, json!({"page_number":1,"slide_id":id}))
            .unwrap();
        let source = receipt["markdown"]
            .as_str()
            .unwrap()
            .replace("Original headline", "Updated headline");
        let (edited, _) = reads
            .prepare(
                &saved,
                json!({"slide_id":id,"expected_revision":4,"markdown":source}),
            )
            .unwrap();
        assert_eq!(edited["deck"]["slides"][1], saved.deck["deck"]["slides"][1]);
        assert_eq!(edited["deck"]["slides"][0]["id"], json!(id));
        assert_eq!(edited["deck"]["theme"], saved.deck["deck"]["theme"]);
        assert!(edited.to_string().contains("Updated headline"));
        assert!(edited.to_string().contains("Keep this body."));
        let mut concurrent = saved.clone();
        concurrent.revision += 1;
        assert!(
            reads
                .prepare(
                    &concurrent,
                    json!({"slide_id":id,"expected_revision":5,"markdown":source})
                )
                .unwrap_err()
                .contains("revision changed")
        );
        assert!(
            reads
                .read(&saved, json!({"page_number":2,"slide_id":id}))
                .is_err()
        );
    }

    #[test]
    fn theme_change_preserves_content_and_rejects_stale_or_unregistered_selection() {
        let saved = saved();
        let changed = theme(
            &saved,
            json!({"theme":"yrkie-atelier","expected_revision":4}),
        )
        .unwrap();
        assert_eq!(changed["deck"]["slides"], saved.deck["deck"]["slides"]);
        assert!(
            theme(
                &saved,
                json!({"theme":"yrkie-atelier","expected_revision":3})
            )
            .is_err()
        );
        assert!(
            theme(
                &saved,
                json!({"theme":"invented-theme","expected_revision":4})
            )
            .is_err()
        );
    }
}
