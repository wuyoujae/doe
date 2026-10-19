//! Minimal Outline authoring. Persistence, confirmation and image jobs remain host-owned.
use super::{decode, image_placeholder, input::OutlineInput, limits};
use crate::presentation::schema::markdown::{parse_tree, Attribute, Node};
use doe_core::asset::generated::{
    GeneratedImageType, MAX_OUTLINE_GENERATED_IMAGES, PRODUCT_IMAGE_RATIOS,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;

mod recovery;
pub use recovery::parse_for_recovery;
mod serialize;
pub use serialize::serialize;
#[cfg(test)]
mod tests;

pub const VERSION: &str = "outline-markdown-2.1";
pub const AUTHORING_PROMPT: &str = include_str!(
    "../../../../../src/document/presentation/schema/authoring/default-prompts/outline.schema.md"
);

pub fn compose_prompt(design: &str) -> String {
    format!("{}\n\n{AUTHORING_PROMPT}", design.trim_end())
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Diagnostic {
    pub line: usize,
    pub path: String,
    pub code: String,
}
pub struct Compilation {
    pub tree: Node,
    pub outline: Value,
    pub diagnostics: Vec<Diagnostic>,
}
fn warn(diagnostics: &mut Vec<Diagnostic>, line: usize, path: &str, code: &str) {
    if diagnostics.len() < 128 {
        diagnostics.push(Diagnostic {
            line,
            path: path.into(),
            code: code.into(),
        });
    }
}
fn error(line: usize, path: &str, code: &str) -> String {
    format!("outline_markdown_invalid: line {line} {path}: {code}")
}
pub fn is_markdown(raw: &str) -> bool {
    if raw.len() > limits::MAX_OUTLINE_RESPONSE_BYTES {
        return false;
    }
    let raw = raw.trim_start_matches('\u{feff}').trim_start();
    !raw.starts_with(['{', '['])
        && raw.lines().any(|line| {
            let Some(value) = line.trim_start().strip_prefix("# ") else {
                return false;
            };
            matches!(
                value.split('=').next().unwrap_or("").trim(),
                "page" | "slide" | "outline"
            ) || value.trim() == "type=outline"
        })
}
fn image_node(node: &Node) -> bool {
    image_placeholder::normalize_marker_source(&format!("{}()", node.tag)).is_some()
}

fn generated(node: &Node, path: &str, diagnostics: &mut Vec<Diagnostic>) -> Result<String, String> {
    let mut prompt = node.body();
    let mut image_type = GeneratedImageType::default().as_str();
    let mut remove_background = None;
    let mut ratio = image_placeholder::DEFAULT_DOE_OUTLINE_IMAGE_RATIO;
    let mut seen = std::collections::HashSet::new();
    for attribute in &node.attributes {
        let key = attribute.key.as_str();
        let field = format!("{path}/{key}");
        if !seen.insert(key) {
            warn(
                diagnostics,
                attribute.line,
                &field,
                "duplicate_field_last_wins",
            );
        }
        match key {
            "prompt" => prompt = attribute.value.clone(),
            "removeBackground" => {
                remove_background = Some(match attribute.value.trim() {
                    "true" => true,
                    "false" => false,
                    _ => return Err(error(attribute.line, &field, "expected_boolean")),
                });
            }
            // Read historical drafts; the explicit boolean takes precedence.
            "type" => {
                image_type = match attribute.value.trim() {
                    "content" => "content",
                    "decorative" => "decorative",
                    _ => {
                        warn(
                            diagnostics,
                            attribute.line,
                            &field,
                            "invalid_value_defaulted",
                        );
                        "decorative"
                    }
                };
            }
            "ratio" => {
                ratio = PRODUCT_IMAGE_RATIOS
                    .iter()
                    .copied()
                    .find(|r| *r == attribute.value.trim())
                    .unwrap_or_else(|| {
                        warn(
                            diagnostics,
                            attribute.line,
                            &field,
                            "invalid_value_defaulted",
                        );
                        image_placeholder::DEFAULT_DOE_OUTLINE_IMAGE_RATIO
                    });
            }
            _ => warn(diagnostics, attribute.line, &field, "unknown_field"),
        }
    }
    for child in &node.children {
        if child.tag == "prompt" {
            prompt = child.body();
        } else {
            warn(diagnostics, child.line, path, "unknown_node");
        }
    }
    if prompt.trim().is_empty() {
        return Err(error(
            node.line,
            &format!("{path}/prompt"),
            "missing_image_prompt",
        ));
    }
    if let Some(remove) = remove_background {
        image_type = if remove { "content" } else { "decorative" };
    }
    Ok(format!(
        "GENRATEIMG[type={image_type},ratio={ratio}]({})",
        prompt.trim()
    ))
}

// Historical function markers are input aliases, never the public V2.1 syntax.
fn normalize_image(
    text: &str,
    line: usize,
    path: &str,
    diagnostics: &mut Vec<Diagnostic>,
) -> Result<String, String> {
    let Some(source) = image_placeholder::normalize_marker_source(text) else {
        return Ok(text.into());
    };
    let suffix = source.strip_prefix("GENRATEIMG").unwrap();
    let (metadata, body) = if let Some(rest) = suffix.strip_prefix('[') {
        rest.split_once("](")
            .ok_or_else(|| error(line, path, "invalid_image_marker"))?
    } else {
        (
            "",
            suffix
                .strip_prefix('(')
                .ok_or_else(|| error(line, path, "invalid_image_marker"))?,
        )
    };
    let prompt = body
        .strip_suffix(')')
        .ok_or_else(|| error(line, path, "invalid_image_marker"))?;
    let mut node = Node {
        tag: "generateimg".into(),
        line,
        value: Some(prompt.into()),
        ..Node::default()
    };
    for entry in metadata.split(',').filter(|s| !s.trim().is_empty()) {
        if let Some((key, value)) = entry.trim().split_once('=') {
            node.attributes.push(Attribute {
                key: key.trim().into(),
                value: value.trim().into(),
                line,
            });
        } else if PRODUCT_IMAGE_RATIOS.contains(&entry.trim()) {
            node.attributes.push(Attribute { key: "ratio".into(), value: entry.trim().into(), line });
        } else {
            warn(diagnostics, line, path, "unknown_field");
        }
    }
    let normalized = generated(&node, path, diagnostics)?;
    if normalized != text {
        warn(diagnostics, line, path, "image_marker_normalized");
    }
    Ok(normalized)
}

pub fn compile(raw: &str) -> Result<Compilation, String> {
    if raw.len() > limits::MAX_OUTLINE_RESPONSE_BYTES {
        return Err(decode::OUTPUT_TOO_LARGE_ERROR.into());
    }
    if raw.trim().is_empty() {
        return Err(decode::EMPTY_OUTPUT_ERROR.into());
    }
    let tree = parse_tree(raw).map_err(|e| error(1, "/outline", &e))?;
    compile_tree(tree)
}
fn compile_tree(tree: Node) -> Result<Compilation, String> {
    let mut diagnostics = Vec::new();
    let mut title = String::new();
    let mut pages = Vec::new();
    let mut locations: HashMap<String, usize> = HashMap::new();
    fn collect<'a>(
        root: &'a Node,
        pages: &mut Vec<&'a Node>,
        title: &mut String,
        diagnostics: &mut Vec<Diagnostic>,
    ) {
        for attr in &root.attributes {
            if attr.key == "title" {
                *title = attr.value.clone();
            } else {
                warn(
                    diagnostics,
                    attr.line,
                    &format!("/outline/{}", attr.key),
                    "system_or_unknown_field",
                );
            }
        }
        for child in &root.children {
            match child.tag.as_str() {
                "page" | "slide" => pages.push(child),
                "outline" => collect(child, pages, title, diagnostics),
                "type" if child.value.as_deref() == Some("outline") => {
                    collect(child, pages, title, diagnostics)
                }
                "title" => *title = child.body(),
                _ => warn(diagnostics, child.line, "/outline", "unknown_node"),
            }
        }
    }
    collect(&tree, &mut pages, &mut title, &mut diagnostics);
    if pages.is_empty() || pages.len() > limits::MAX_OUTLINE_SLIDES {
        return Err(error(1, "/outline/body", "page_count_limit"));
    }
    let mut body = Vec::new();
    for (i, page) in pages.into_iter().enumerate() {
        let path = format!("/outline/body/{i}");
        locations.insert(path.clone(), page.line);
        let mut contents = Vec::new();
        let mut push =
            |text: String, line: usize, diagnostics: &mut Vec<Diagnostic>| -> Result<(), String> {
                let target = format!("{path}/contents/{}", contents.len());
                if text.trim().is_empty() {
                    warn(diagnostics, line, &target, "empty_text_omitted");
                    return Ok(());
                }
                let value = normalize_image(text.trim(), line, &target, diagnostics)?;
                locations.insert(target, line);
                contents.push(value);
                Ok(())
            };
        if !page.body().trim().is_empty() {
            push(page.body(), page.line, &mut diagnostics)?;
        }
        for attr in &page.attributes {
            if matches!(attr.key.as_str(), "title" | "text") {
                push(attr.value.clone(), attr.line, &mut diagnostics)?;
            } else {
                warn(
                    &mut diagnostics,
                    attr.line,
                    &format!("{path}/{}", attr.key),
                    "system_or_unknown_field",
                );
            }
        }
        for node in &page.children {
            if image_node(node) {
                let value = generated(node, &format!("{path}/generateimg"), &mut diagnostics)?;
                push(value, node.line, &mut diagnostics)?;
            } else if matches!(node.tag.as_str(), "text" | "item" | "title" | "content") {
                let mut value = node.body();
                for attr in &node.attributes {
                    if matches!(attr.key.as_str(), "text" | "title") {
                        value = attr.value.clone();
                    } else {
                        warn(
                            &mut diagnostics,
                            attr.line,
                            &format!("{path}/{}", attr.key),
                            "unknown_field",
                        );
                    }
                }
                for child in &node.children {
                    warn(&mut diagnostics, child.line, &path, "unknown_node");
                }
                push(value, node.line, &mut diagnostics)?;
            } else {
                warn(&mut diagnostics, node.line, &path, "unknown_node");
            }
        }
        if contents.is_empty() {
            return Err(error(page.line, &path, "missing_page_content"));
        }
        body.push(json!({"index":i+1,"page":i+1,"contents":contents}));
    }
    if title.trim().is_empty() || title.trim().len() > 300 {
        if !title.trim().is_empty() {
            warn(
                &mut diagnostics,
                1,
                "/outline/title",
                "invalid_value_defaulted",
            );
        }
        let first = body
            .iter()
            .flat_map(|p| p["contents"].as_array().unwrap())
            .filter_map(Value::as_str)
            .find(|s| {
                !s.starts_with("GENRATEIMG[") && doe_core::asset::reference::asset_id(s).is_none()
            })
            .unwrap_or("Untitled presentation");
        let mut end = first.len().min(300);
        while !first.is_char_boundary(end) {
            end -= 1;
        }
        title = first[..end].into();
    }
    let outline = json!({"title":title.trim(),"page_count":body.len(),"body":body});
    let mut failure =
        doe_core::diagnostic::compatibility::Failure::from("outline_markdown_invalid");
    super::validation::outline(&outline, &mut failure);
    if let Some(issue) = failure.issues.first() {
        let line = locations
            .iter()
            .filter(|(path, _)| issue.path.starts_with(path.as_str()))
            .max_by_key(|(p, _)| p.len())
            .map(|(_, n)| *n)
            .unwrap_or(1);
        return Err(error(line, &issue.path, &issue.code));
    }
    // The materializer receives exactly the marker syntax validated here.
    if image_placeholder::scan(&outline)?.len() > MAX_OUTLINE_GENERATED_IMAGES {
        return Err(error(1, "/outline/body", "image_limit"));
    }
    Ok(Compilation {
        tree,
        outline,
        diagnostics,
    })
}

pub fn decode(raw: &str) -> Result<decode::DecodedDoeOutlineOutput, String> {
    let compiled = compile(raw)?;
    let outline: OutlineInput =
        serde_json::from_value(compiled.outline.clone()).map_err(|e| e.to_string())?;
    Ok(decode::DecodedDoeOutlineOutput {
        operation: decode::OutlineOperation::Create,
        expected_revision: None,
        outline,
        canonical_json:
            json!({"operation":"create","expected_revision":null,"outline":compiled.outline})
                .to_string(),
        syntax_repair_count: compiled.diagnostics.len(),
        syntax_repair_summary: format!("{VERSION}:defaults={}", compiled.diagnostics.len()),
    })
}

/// Preview only complete lines, omit an unfinished final node, never execute images or save.
pub fn preview(raw: &str) -> Option<Value> {
    if raw.len() > limits::MAX_OUTLINE_RESPONSE_BYTES {
        return None;
    }
    let end = raw.rfind('\n')?;
    let prefix = &raw[..=end];
    let mut tree = parse_tree(prefix).ok()?;
    fn discard_incomplete(node: &mut Node) {
        if let Some(last) = node.children.last_mut() {
            discard_incomplete(last);
            if last.body().trim().is_empty()
                && last
                    .attributes
                    .iter()
                    .all(|a| a.key != "prompt" && a.key != "text" && a.key != "title")
                && last.children.is_empty()
            {
                node.children.pop();
            }
        }
    }
    discard_incomplete(&mut tree);
    compile_tree(tree).ok().map(|c| c.outline)
}
