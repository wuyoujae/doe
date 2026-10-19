use super::imagery::{self, VisualPlan};
use doe_document::presentation::{
    outline,
    schema::{contract, markdown},
};
use serde_json::Value;

pub fn outline(
    source: &str,
    plan: Option<&VisualPlan>,
    allowed: &[String],
) -> Result<Value, String> {
    bounded_markdown(source)?;
    let result = outline::markdown::compile(source)?;
    // A successful permissive compile must not silently discard requested authoring nodes.
    if !result.diagnostics.is_empty() {
        return Err(format!(
            "Repair unsupported outline syntax: {}",
            result
                .diagnostics
                .iter()
                .take(12)
                .map(|item| format!("line {} {} {}", item.line, item.path, item.code))
                .collect::<Vec<_>>()
                .join("; ")
        ));
    }
    imagery::validate(&result.outline, plan)?;
    let references = contract::collect_outline_image_sources(&result.outline);
    if references.iter().any(|source| !allowed.contains(source)) {
        return Err("Outline references an image that does not belong to this project. Use generateimg for new images.".into());
    }
    let mut document = result.outline;
    if let Some(plan) = plan {
        document["visual_plan"] = serde_json::to_value(plan).map_err(|_| "Invalid visual plan")?;
    }
    Ok(document)
}

pub fn deck(
    source: &str,
    outline: &Value,
    allowed: &[String],
    replacements: &[String],
) -> Result<Value, String> {
    bounded_markdown(source)?;
    require_theme(source)?;
    if !outline::image_placeholder::scan(outline)?.is_empty() {
        return Err("The confirmed outline still contains ungenerated images".into());
    }
    let count = outline["body"]
        .as_array()
        .ok_or("Confirmed outline is invalid")?
        .len();
    let result = markdown::preview::process(
        source,
        contract::SlideDeckExpectations::new(count)?,
        allowed,
        false,
    )?;
    if let Some(plan) = outline.get("visual_plan").filter(|value| !value.is_null()) {
        let plan: VisualPlan =
            serde_json::from_value(plan.clone()).map_err(|_| "The saved visual plan is invalid")?;
        imagery::verify_placements(outline, &result.parsed.slides, &plan, replacements)?;
    } else if count == 1 {
        let expected = contract::collect_outline_image_sources(outline);
        let placed = imagery::placed_sources(&result.parsed.slides[0]);
        if !expected.is_empty()
            && !placed
                .iter()
                .any(|source| expected.contains(source) || replacements.contains(source))
        {
            return Err("The confirmed single-page outline contains an image, but no planned image or generated replacement appears on the slide".into());
        }
    }
    let value: Value = serde_json::from_str(&result.parsed.canonical_json)
        .map_err(|_| "Compiled deck could not be decoded")?;
    Ok(value)
}

fn bounded_markdown(source: &str) -> Result<(), String> {
    if source.trim().is_empty()
        || source.len() > crate::doe::compiler::MAX_MARKDOWN_BYTES
        || source.contains('\0')
    {
        return Err("Supply nonempty Markdown up to 2 MiB without null characters".into());
    }
    Ok(())
}

fn require_theme(source: &str) -> Result<(), String> {
    let tree = markdown::parse_tree(source)?;
    let project = tree
        .children
        .iter()
        .find(|node| matches!(node.tag.as_str(), "presentation" | "type"));
    let mut selections = Vec::new();
    for node in std::iter::once(&tree).chain(project) {
        selections.extend(
            node.attributes
                .iter()
                .filter(|attribute| attribute.key == "theme")
                .map(|attribute| attribute.value.trim().to_string()),
        );
        selections.extend(
            node.children
                .iter()
                .filter(|child| child.tag == "theme")
                .map(|child| {
                    child
                        .value
                        .clone()
                        .unwrap_or_else(|| child.text.join("\n"))
                        .trim()
                        .to_string()
                }),
        );
    }
    let registered = contract::registered_theme_ids();
    if selections.is_empty() || selections.iter().any(|theme| !registered.contains(theme)) {
        return Err(format!(
            "Select a registered theme explicitly with theme=<id> before the first # slide. Registered themes: {}",
            registered.join(", ")
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn decks_require_explicit_theme_and_fulfill_every_planned_image() {
        let asset = format!("yrkie-asset-data://{}", "a".repeat(64));
        let plan: VisualPlan = serde_json::from_value(json!({"pages":[{"page_number":1,"role":"surface","reason":"Quiet background supporting the message"}]})).expect("plan");
        let document = outline(
            &format!("# page\n## text\nHello\n## text\n{asset}"),
            Some(&plan),
            std::slice::from_ref(&asset),
        )
        .expect("outline");
        assert!(
            deck(
                "# slide\n## paragraph\nHello",
                &document,
                std::slice::from_ref(&asset),
                &[]
            )
            .err()
            .expect("theme required")
            .contains("theme")
        );
        let source = format!(
            "theme={}\n# slide\n## paragraph\nHello",
            contract::registered_theme_ids()[0]
        );
        assert!(
            deck(&source, &document, &[asset], &[])
                .err()
                .expect("image required")
                .contains("unfulfilled")
        );
    }
}
