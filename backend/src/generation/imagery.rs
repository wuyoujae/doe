// Origin: commercial DOE direct author image commitments (2026-10-12); no platform storage.
//! A page-level image commitment, separate from audience-facing Outline copy.
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct VisualPlan {
    pub pages: Vec<PageVisual>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub native_interior_reason: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct PageVisual {
    pub page_number: usize,
    pub role: ImageRole,
    pub reason: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_page: Option<usize>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ImageRole {
    Subject,
    Atmosphere,
    Surface,
    Native,
}

pub fn schema() -> Value {
    json!({"type":"object","description":"Internal page-by-page visual plan, never visible slide copy. Required for a multi-page Outline. Plan useful interior subject, atmosphere or page-surface images now; native evidence pages can remain quiet. Reference a page with generateimg or an existing authorized image; reuse does not generate another asset. Do not make every page the same image/card recipe.","properties":{
        "pages":{"type":"array","minItems":1,"maxItems":100,"items":{"type":"object","properties":{
            "page_number":{"type":"integer","minimum":1,"maximum":100},
            "role":{"type":"string","enum":["subject","atmosphere","surface","native"]},
            "reason":{"type":"string","minLength":1,"maxLength":600,"description":"Specific compositional job or why this evidence page should remain native. Not a generic minimalist excuse."},
            "source_page":{"type":"integer","minimum":1,"maximum":100,"description":"Page containing the planned/existing image to use; omit for this page or for native. Reuse a coherent image with a purposeful crop."}
        },"required":["page_number","role","reason"],"additionalProperties":false}},
        "native_interior_reason":{"type":"string","minLength":1,"maxLength":1000,"description":"Only for an intentionally all-native interior: cite the explicit user no-image constraint or the specific evidence-led brief that requires this exception. Do not defer needed imagery to a later user request. Omit for a normal visual presentation."}
    },"required":["pages"],"additionalProperties":false})
}

fn pages(document: &Value) -> Result<&Vec<Value>, String> {
    document["body"]
        .as_array()
        .ok_or_else(|| "doe_visual_plan_outline_unavailable".into())
}

fn sources(page: &Value) -> Vec<String> {
    doe_document::presentation::schema::contract::collect_outline_image_sources(page)
}

pub(super) fn placed_sources(slide: &Value) -> Vec<String> {
    fn image_source(source: &Value) -> Vec<String> {
        sources(&json!({"type":"image","src":source}))
    }
    fn visit(nodes: &Value, result: &mut Vec<String>) {
        for node in nodes.as_array().into_iter().flatten() {
            match node["type"].as_str() {
                Some("media" | "image-text") => result.extend(image_source(&node["props"]["src"])),
                Some("contents") if node["props"]["presentation"] == "image-text" => {
                    for item in node["props"]["items"].as_array().into_iter().flatten() {
                        result.extend(image_source(&item["src"]));
                    }
                }
                Some("layout-group") => visit(&node["children"], result),
                _ => {}
            }
        }
    }
    let mut result = Vec::new();
    if slide["background"]["enabled"] != false
        && slide["layout"]["allowsBleed"] != true
        && !matches!(
            slide["layout"]["preset"].as_str(),
            Some("edge-media" | "split-right-bleed")
        )
    {
        let background = &slide["background"];
        let source = background["src"]
            .as_str()
            .filter(|source| !source.is_empty())
            .map_or(&background["image"]["src"], |_| &background["src"]);
        result.extend(image_source(source));
    }
    visit(&slide["blocks"], &mut result);
    result
}

fn has_asset_plan(page: &Value) -> bool {
    !sources(page).is_empty()
        || page["contents"]
            .as_array()
            .into_iter()
            .flatten()
            .any(is_generated_image)
}

fn is_generated_image(unit: &Value) -> bool {
    unit.is_string()
        && doe_document::presentation::outline::image_placeholder::scan(
            &json!({"body":[{"contents":[unit]}]}),
        )
        .is_ok_and(|plans| !plans.is_empty())
}

pub fn validate(document: &Value, plan: Option<&VisualPlan>) -> Result<(), String> {
    let outline_pages = pages(document)?;
    let Some(plan) = plan else {
        return if outline_pages.len() <= 1 {
            Ok(())
        } else {
            Err("doe_visual_plan_required: Supply visual_plan.pages for every page, with its image role, source_page when reusing an image, and a brief composition reason. Add necessary generateimg nodes now; do not leave useful interior imagery for a later user request. Audience copy stays in markdown.".into())
        };
    };
    if plan.pages.len() != outline_pages.len() {
        return Err(
            "doe_visual_plan_page_count: Plan every Outline page exactly once in page order."
                .into(),
        );
    }
    for (index, visual) in plan.pages.iter().enumerate() {
        if visual.page_number != index + 1
            || visual.reason.trim().is_empty()
            || visual.reason.chars().count() > 600
        {
            return Err(format!(
                "doe_visual_plan_invalid: Page {} requires its exact page_number and a specific reason of 1..600 characters.",
                index + 1
            ));
        }
        if visual.role == ImageRole::Native {
            if visual.source_page.is_some() || has_asset_plan(&outline_pages[index]) {
                return Err(format!(
                    "doe_visual_plan_conflict: Page {} is native but also plans/references an image; choose its actual image role.",
                    index + 1
                ));
            }
        } else {
            let source = visual.source_page.unwrap_or(index + 1);
            if source == 0
                || source > outline_pages.len()
                || !has_asset_plan(&outline_pages[source - 1])
            {
                return Err(format!(
                    "doe_visual_plan_missing_asset: Page {} promises an image from page {source}, which has no generateimg node or authorized image reference. Add the asset plan; visible prose is not an image plan.",
                    index + 1
                ));
            }
        }
    }
    if let Some(reason) = &plan.native_interior_reason {
        if reason.trim().is_empty() || reason.chars().count() > 1000 {
            return Err("doe_visual_plan_invalid_native_exception: Supply a specific reason of 1..1000 characters, or omit the field.".into());
        }
    }
    if outline_pages.len() > 1
        && plan
            .pages
            .iter()
            .skip(1)
            .all(|page| page.role == ImageRole::Native)
        && plan.native_interior_reason.is_none()
    {
        return Err("doe_visual_plan_cover_only: Every interior page is native-only. Plan the subject, atmosphere or decorative page-surface imagery this story needs. Use native_interior_reason only for an explicit user no-image constraint or an intentionally evidence-only brief, not to avoid design or defer images to a later request.".into());
    }
    Ok(())
}

pub fn verify_placements(
    document: &Value,
    slides: &[Value],
    plan: &VisualPlan,
    newly_generated: &[String],
) -> Result<(), String> {
    let outline_pages = pages(document)?;
    for (index, slide) in slides.iter().enumerate() {
        let Some(visual) = plan.pages.get(index) else {
            return Err("doe_visual_plan_page_count".into());
        };
        if visual.role == ImageRole::Native {
            continue;
        }
        let source = visual.source_page.unwrap_or(index + 1);
        let source_page = outline_pages
            .get(source.saturating_sub(1))
            .ok_or("doe_visual_plan_source_page_unavailable")?;
        let expected = sources(source_page);
        let placed = placed_sources(slide);
        // An authorized replacement generated in this Run can fulfill the same
        // visual job; the original asset must otherwise appear on this page.
        if !placed
            .iter()
            .any(|asset| expected.contains(asset) || newly_generated.contains(asset))
        {
            return Err(format!(
                "doe_visual_plan_unfulfilled: Page {} promised {:?} imagery from page {source}, but no planned image or newly generated replacement appears on that page. Place its exact authorized asset reference in a visible image/background component before CreateDeck; do not ask the user to request the omitted image again.",
                index + 1,
                visual.role
            ));
        }
    }
    Ok(())
}
