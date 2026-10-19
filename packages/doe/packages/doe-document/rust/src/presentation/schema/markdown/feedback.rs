//! Bounded author-facing diagnostics. These never change validation or candidate content.
use super::*;
use crate::presentation::schema::contract as deck_contract;

const MAX_ISSUES: usize = 32;
const MAX_BYTES: usize = 24 * 1024;

fn clip(value: &str, limit: usize) -> String {
    let mut chars = value.chars();
    let mut result: String = chars.by_ref().take(limit).collect();
    if chars.next().is_some() { result.push('…'); }
    result
}

fn message(code: &str) -> &'static str {
    match code {
        "invalid_value" => "This field has an invalid value or authoring syntax.",
        "missing_content" => "Required content is missing or could not be parsed. Fix earlier syntax errors before adding/removing content.",
        "conflicting_field_content" => "This field is written more than once with different content. Keep one definition per field. Put multiline content under that field's child heading (for example ### text or ### subtitle), not in bare lines after key=value. Preserve all intended content in the correct fields.",
        "item_count" | "shape_item_count" => "The item count does not satisfy this component's contract. Correct the item structure/count; do not discard the component.",
        "unknown_field" => "This property is not supported by the component.",
        "image_options_presentation" => "Image size, fit, aspect ratio and surface options belong only to image-above-text or image-caption. Keep them on the component, outside items. Remove them from other component styles without changing their content.",
        "misplaced_field" => "This is a deck setting. Move it before the first # slide, keeping its value and all slide content unchanged.",
        "block_count" => "A slide must contain between 1 and 2048 valid root components.",
        "unknown_component" => "This component tag is unsupported. Replace it with a supported component from the supplied Slide Schema, preserving its intended content; do not delete it to make validation pass.",
        _ => "Correct this field according to the supplied Slide Schema, retaining unrelated content.",
    }
}

fn diagnostic(raw: &str, d: &Diagnostic) -> Value {
    let lines: Vec<_> = raw.lines().collect();
    let line = lines.get(d.line.saturating_sub(1)).copied().unwrap_or("");
    let mut result = json!({"code":d.code,"path":d.path,"line":d.line,
        "message":message(&d.code),"source":clip(line,320)});
    if let Some(expected) = &d.expected { result["expected"] = expected.clone(); }
    if let Some(actual) = &d.actual { result["actual"] = actual.clone(); }
    if d.code == "invalid_value" {
        if let Some((_, value)) = line.split_once('=') {
            if super::compact::starts(value) {
                let (value, _) = super::compact::collect(&lines, d.line - 1, value);
                if let Some(detail) = super::compact::explain(&value, d.line) {
                    result["actual"] = json!(clip(&value,320));
                    result["syntax"] = detail;
                }
            }
        }
    }
    result
}

fn page_summary(value: &Value) -> Vec<Value> {
    fn title(v: &Value) -> Option<&str> {
        if matches!(v["type"].as_str(), Some("hero" | "heading")) {
            return v["props"]["title"].as_str().or_else(|| v["props"]["text"].as_str());
        }
        v["children"].as_array().and_then(|a| a.iter().find_map(title))
    }
    value["deck"]["slides"].as_array().into_iter().flatten().take(32).enumerate().map(|(i, s)| {
        let heading = s["blocks"].as_array().and_then(|a| a.iter().find_map(title)).unwrap_or("");
        json!({"page":i+1,"title":clip(heading,100)})
    }).collect()
}

fn asset_issues(value: &Value, allowed: &[String], path: &str, src: bool, issues: &mut Vec<Value>, total: &mut usize) {
    match value {
        Value::String(source) => {
            // Reuse the exact authorization predicate, including logo and managed-reference rules.
            let candidate = if src { json!({"src":source}) } else { value.clone() };
            if deck_contract::validate_agent_image_sources_strict(&candidate, allowed).is_err() {
                *total += 1;
                if issues.len() < MAX_ISSUES {
                    issues.push(json!({"code":"asset_reference_mismatch","path":clip(path,400),
                        "actual":clip(source,400),"message":"This image reference is not an exact authorized source for this task.",
                        "hint":"Copy an exact authorized source from the supplied project context or GenerateImage result. Do not invent/retype IDs, remove images to bypass validation, or regenerate successful assets."}));
                }
            }
        }
        Value::Array(items) => for (i, item) in items.iter().enumerate() {
            asset_issues(item, allowed, &format!("{path}/{i}"), false, issues, total);
        },
        Value::Object(object) => for (key, item) in object {
            let key_path = key.replace('~', "~0").replace('/', "~1");
            asset_issues(item, allowed, &format!("{path}/{key_path}"), key == "src", issues, total);
        },
        _ => {}
    }
}

/// Called only for a rejected candidate. Success and persistence remain owned by the caller.
pub fn creation_failure(raw: &str, expected_pages: usize, allowed: &[String], error: &str) -> Value {
    let mut issues = Vec::new();
    let mut total = 0;
    let mut result = json!({"status":"failed","committed":false,"error":clip(error,1500),
        "errorTruncated":error.chars().count()>1500,
        "retry":{"action":"correct_input","instruction":"Correct the reported locations and resubmit the complete document. Preserve confirmed page content, images and valid components. Do not simplify/delete content merely to pass validation. No candidate was saved."}});
    let value = if raw.len() > deck_contract::MAX_OUTPUT_BYTES {
        issues.push(json!({"code":"output_too_large","path":"/markdown","actualBytes":raw.len(),"maximumBytes":deck_contract::MAX_OUTPUT_BYTES}));
        total += 1;
        None
    } else if is_markdown(raw) {
        match compile_detailed(raw, &[]) {
            Ok(compiled) => Some(compiled.value),
            Err(failure) => {
                for d in failure.diagnostics.iter().filter(|d| d.level == "error") {
                    total += 1;
                    if issues.len() < MAX_ISSUES { issues.push(diagnostic(raw, d)); }
                }
                None
            }
        }
    } else {
        match serde_json::from_str::<Value>(raw) {
            Ok(value) => Some(value),
            Err(e) => {
                total += 1;
                issues.push(json!({"code":"invalid_json","path":"/arguments","line":e.line(),"column":e.column(),"message":e.to_string(),"hint":"Submit the full Slide Markdown in the markdown string argument."}));
                None
            }
        }
    };
    if let Some(value) = value {
        if let Some(pages) = value["deck"]["slides"].as_array() {
            result["pages"] = json!(page_summary(&value));
            result["pagesTruncated"] = json!(pages.len() > 32);
            if pages.len() != expected_pages {
                total += 1;
                issues.push(json!({"code":"slide_count_mismatch","path":"/deck/slides",
                    "expected":expected_pages,"actual":pages.len(),
                    "message":"The document's actual slide count differs from the confirmed Outline.",
                    "hint":"Check each # slide against the numbered page titles. Count cover and closing slides too. Components do not create extra pages; preserve the confirmed Outline's content and page mapping."}));
            }
            for (index, slide) in pages.iter().enumerate() {
                if let Err(failure) = deck_contract::validation::validate_slide(slide) {
                    for issue in failure.issues {
                        total += 1;
                        if issues.len() < MAX_ISSUES {
                            let mut issue = serde_json::to_value(issue).expect("serializable diagnostic");
                            for field in issue.as_object_mut().unwrap().values_mut() {
                                if let Some(text) = field.as_str() { *field = json!(clip(text,400)); }
                            }
                            issue["page"] = json!(index + 1);
                            issues.push(issue);
                        }
                    }
                }
            }
        }
        asset_issues(&value, allowed, "", false, &mut issues, &mut total);
        if issues.iter().any(|i| i["code"] == "asset_reference_mismatch") {
            let sources: Vec<_> = allowed.iter().filter(|s|s.len()<=1024).take(8).collect();
            result["authorizedSourcesTruncated"] = json!(sources.len()<allowed.len());
            result["authorizedSources"] = json!(sources);
        }
    }
    if issues.is_empty() {
        total += 1;
        issues.push(json!({"code":"validation_failed","path":"/markdown","message":clip(error,1500),
            "hint":"Use the supplied Schema to correct the reported field. Preserve unrelated content; do not interpret a schema error as a layout overflow."}));
    }
    result["issueCount"] = json!(total);
    result["issues"] = json!(issues);
    while result.to_string().len() > MAX_BYTES && result["issues"].as_array().unwrap().len() > 1 {
        result["issues"].as_array_mut().unwrap().pop();
    }
    for (field, flag) in [("pages", "pagesTruncated"), ("authorizedSources", "authorizedSourcesTruncated")] {
        while result.to_string().len() > MAX_BYTES - 128 && result[field].as_array().is_some_and(|a|!a.is_empty()) {
            result[field].as_array_mut().unwrap().pop();
            result[flag] = json!(true);
        }
    }
    result["issuesTruncated"] = json!(result["issues"].as_array().unwrap().len() < total);
    result
}

#[cfg(test)]
mod tests;
