// Origin: app/backend/core/src/plugin_slide_markdown.rs::render
use super::*;


pub fn render(
    title: &str,
    slide: &Value,
    page: i64,
    total: i64,
    internal_ids: &[&str],
) -> Result<String, String> {
    let nodes = array(&slide["blocks"])?;
    let mut ids = internal_ids.to_vec();
    collect_ids(nodes, &mut ids, 0, &mut 2048)?;
    let page_title = first_heading(nodes)
        .map(|s| format!("：{}", safe_text(s, &ids).replace('\n', " ")))
        .unwrap_or_default();
    let mut writer = Writer {
        out: String::new(),
        ids: &ids,
        cells: 0,
    };
    writer.add(&format!(
        "# {title}\n\n## 第 {page} 页 / 共 {total} 页{page_title}\n"
    ))?;
    if nodes.is_empty() {
        writer.add("\n此页没有内容组件。\n")?;
    }
    for node in nodes {
        writer.node(node, 3)?;
    }
    Ok(writer.out)
}
