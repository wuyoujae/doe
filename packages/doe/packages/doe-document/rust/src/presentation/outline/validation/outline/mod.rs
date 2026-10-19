// Origin: app/backend/core/src/plugin_outline_validation.rs::outline
use super::*;


pub fn outline(v: &Value, errors: &mut Failure) {
    use crate::presentation::outline::limits::{
        MAX_OUTLINE_CONTENT_ITEMS, MAX_OUTLINE_CONTENT_LEN, MAX_OUTLINE_SLIDES,
    };
    if v.to_string().len() > MAX_DOCUMENT_BYTES {
        errors.issue(
            "/outline",
            "document_size",
            "Outline exceeds 1 MiB of UTF-8 JSON.",
            "Reduce the total content size; nothing will be truncated automatically.",
        );
        return;
    }
    if object(v, "/outline", &["title", "page_count", "body"], errors).is_none() {
        return;
    }
    text(&v["title"], "/outline/title", 300, errors);
    let Some(pages) = v["body"].as_array() else {
        errors.issue(
            "/outline/body",
            "type",
            "Expected an array of pages.",
            "Use body: [{index: 1, page: 1, contents: [\"Page title\"]}].",
        );
        return;
    };
    if pages.is_empty() || pages.len() > MAX_OUTLINE_SLIDES {
        errors.issue(
            "/outline/body",
            "page_limit",
            "Outline must contain 1..100 pages.",
            "Supply between 1 and 100 complete pages.",
        );
        return;
    }
    if v["page_count"].as_u64() != Some(pages.len() as u64) {
        errors.issue(
            "/outline/page_count",
            "page_count",
            "page_count must equal the number of body entries.",
            &format!("Set page_count to the integer {}.", pages.len()),
        );
    }
    let mut image_count = 0;
    for (i, page) in pages.iter().enumerate() {
        let path = format!("/outline/body/{i}");
        if object(page, &path, &["index", "page", "contents"], errors).is_none() {
            continue;
        }
        for name in ["index", "page"] {
            if page[name].as_u64() != Some(i as u64 + 1) {
                errors.issue(
                    &format!("{path}/{name}"),
                    "page_sequence",
                    "Page numbers must be consecutive integers starting at 1.",
                    &format!("Set this field to {}.", i + 1),
                );
            }
        }
        let Some(contents) = page["contents"].as_array() else {
            errors.issue(
                &format!("{path}/contents"),
                "type",
                "Expected an array of strings.",
                "Put each title, paragraph, data description or image plan in a separate string.",
            );
            continue;
        };
        if contents.is_empty() || contents.len() > MAX_OUTLINE_CONTENT_ITEMS {
            errors.issue(
                &format!("{path}/contents"),
                "item_limit",
                "Each page must contain 1..100 content items.",
                "Reduce or fill the contents array.",
            );
            continue;
        }
        for (j, content) in contents.iter().enumerate() {
            let path = format!("{path}/contents/{j}");
            // Syntax only: every accepted reference must also pass transactional
            // project-asset authorization in the write/confirmation service.
            if content.as_str().and_then(doe_core::asset::reference::asset_id).is_some() {
                continue;
            }
            text(content, &path, MAX_OUTLINE_CONTENT_LEN, errors);
            let Some(s) = content.as_str() else {
                continue;
            };
            if s.starts_with("GENRATEIMG")
                || crate::presentation::outline::image_placeholder::normalize_marker_source(s).is_some()
            {
                let canonical = s.starts_with("GENRATEIMG[type=");
                let parsed = crate::presentation::outline::image_placeholder::scan(
                    &serde_json::json!({"body":[{"contents":[s]}]}),
                );
                if !canonical || !parsed.as_ref().is_ok_and(|v| v.len() == 1) {
                    errors.issue(&path, "image_marker", "Invalid generated-image marker.", "Use exactly GENRATEIMG[type=content|decorative,ratio=16:9](nonempty prompt). See the schema reference for supported ratios.");
                } else {
                    image_count += 1;
                }
            }
        }
    }
    if image_count > 16 {
        errors.issue(
            "/outline/body",
            "image_limit",
            "An outline may contain at most 16 generated-image plans.",
            "Keep at most 16 GENRATEIMG items. These are plans; creation does not generate images.",
        );
    }
}
