// Origin: app/backend/core/src/doe_outline_image_plugin.rs::parse_doe_source
use super::*;


pub(super) fn parse_doe_source(source: &str) -> Result<Option<ParsedDoeImageSource>, String> {
    let normalized = normalize_marker_source(source);
    let source = normalized.as_deref().unwrap_or(source);

    if source.starts_with(LEGACY_MARKER_PREFIX) {
        return parse_source(source).map(|prompt| {
            prompt.map(|prompt| ParsedDoeImageSource {
                prompt,
                ratio: DEFAULT_DOE_OUTLINE_IMAGE_RATIO.to_string(),
                image_type: GeneratedImageType::Decorative,
            })
        });
    }

    if let Some(configured) = source.strip_prefix(TYPED_MARKER_PREFIX) {
        let (metadata, prompt_body) = configured
            .split_once("](")
            .ok_or_else(marker_syntax_error)?;
        let (image_type, ratio) = metadata
            .split_once(",ratio=")
            .ok_or_else(marker_syntax_error)?;
        let image_type = match image_type {
            "content" => GeneratedImageType::Content,
            "decorative" => GeneratedImageType::Decorative,
            _ => return Err("Generated image type must be content or decorative.".to_string()),
        };
        if !PRODUCT_IMAGE_RATIOS.contains(&ratio) {
            return Err(format!(
                "Generated image ratio must be one of: {}.",
                PRODUCT_IMAGE_RATIOS.join(", ")
            ));
        }
        return Ok(Some(ParsedDoeImageSource {
            prompt: parse_prompt_body(prompt_body)?,
            ratio: ratio.to_string(),
            image_type,
        }));
    }

    if let Some(configured) = source.strip_prefix(CONFIGURED_MARKER_PREFIX) {
        let (ratio, prompt_body) = configured
            .split_once("](")
            .ok_or_else(marker_syntax_error)?;
        if !PRODUCT_IMAGE_RATIOS.contains(&ratio) {
            return Err(format!(
                "Generated image ratio must be one of: {}.",
                PRODUCT_IMAGE_RATIOS.join(", ")
            ));
        }
        return Ok(Some(ParsedDoeImageSource {
            prompt: parse_prompt_body(prompt_body)?,
            ratio: ratio.to_string(),
            image_type: GeneratedImageType::Decorative,
        }));
    }

    if source.starts_with("GENRATEIMG") {
        return Err(marker_syntax_error());
    }

    Ok(None)
}
