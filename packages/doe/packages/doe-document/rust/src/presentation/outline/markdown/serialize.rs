use super::*;

fn literal(text: &str) -> String {
    let fence = "`".repeat(
        text.split('\n')
            .map(|line| line.trim_start().chars().take_while(|c| *c == '`').count())
            .max()
            .unwrap_or(0)
            .max(2)
            + 1,
    );
    if text.lines().any(|line| {
        line.trim_start().starts_with(['#', '\\'])
            || line.contains('=')
            || line.trim_start().starts_with("```")
            || line.trim_start().starts_with("~~~")
    }) {
        format!("{fence}\n{text}\n{fence}")
    } else {
        text.into()
    }
}

pub fn serialize(value: &Value) -> Result<String, String> {
    let outline = value.get("outline").unwrap_or(value);
    let pages = outline["body"]
        .as_array()
        .ok_or("outline_markdown_requires_v1")?;
    let title = outline["title"].as_str().unwrap_or("");
    let mut output = if title.contains(['\n', '\r']) {
        format!("# title\n{}\n\n", literal(title))
    } else if title.is_empty() {
        String::new()
    } else {
        format!("title={title}\n\n")
    };
    for page in pages {
        output.push_str("# page\n\n");
        for content in page["contents"]
            .as_array()
            .ok_or("outline_markdown_requires_contents")?
        {
            let text = content.as_str().ok_or("outline_markdown_requires_text")?;
            let images = image_placeholder::scan(&json!({"body":[{"contents":[text]}]}))?;
            if let Some(image) = images.first() {
                output.push_str("## generateimg\n");
                if image.image_type != GeneratedImageType::default() {
                    output.push_str("removeBackground=true\n");
                }
                if image.ratio != image_placeholder::DEFAULT_DOE_OUTLINE_IMAGE_RATIO {
                    output.push_str(&format!("ratio={}\n", image.ratio));
                }
                output.push_str(&literal(&image.prompt));
            } else {
                output.push_str("## text\n");
                output.push_str(&literal(text));
            }
            output.push_str("\n\n");
        }
    }
    Ok(output)
}
