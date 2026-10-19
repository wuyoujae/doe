// Origin: app/backend/core/src/doe_outline_image_plugin.rs::scan
use super::*;


pub fn scan(document: &Value) -> Result<Vec<DoeOutlineImagePlaceholder>, String> {
    let Some(body) = document.get("body") else {
        return Ok(Vec::new());
    };
    let slides = body
        .as_array()
        .ok_or_else(|| "DOE Outline V1 body must be an array.".to_string())?;
    let mut placeholders = Vec::new();
    for (slide_index, slide) in slides.iter().enumerate() {
        let contents = slide
            .get("contents")
            .and_then(Value::as_array)
            .ok_or_else(|| {
                format!("DOE Outline V1 body[{slide_index}].contents must be an array.")
            })?;
        for (content_index, content) in contents.iter().enumerate() {
            let source = content.as_str().ok_or_else(|| {
                format!(
                    "DOE Outline V1 body[{slide_index}].contents[{content_index}] must be a string."
                )
            })?;
            if let Some(parsed) = parse_doe_source(source)? {
                placeholders.push(DoeOutlineImagePlaceholder {
                    json_pointer: format!("/body/{slide_index}/contents/{content_index}"),
                    source: source.to_string(),
                    prompt: parsed.prompt,
                    ratio: parsed.ratio,
                    image_type: parsed.image_type,
                });
            }
        }
    }
    Ok(placeholders)
}
