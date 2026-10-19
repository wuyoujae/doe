// Origin: app/backend/core/src/doe_outline_image_plugin.rs::parse_prompt_body
use super::*;


pub(super) fn parse_prompt_body(prompt_body: &str) -> Result<String, String> {
    let prompt = prompt_body
        .strip_suffix(')')
        .ok_or_else(marker_syntax_error)?
        .trim();
    if prompt.is_empty() {
        return Err("Generated image prompt must not be empty.".to_string());
    }
    if prompt.chars().count() > MAX_IMAGE_PROMPT_CHARS {
        return Err("Generated image prompt is too long.".to_string());
    }
    Ok(prompt.to_string())
}
