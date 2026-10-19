// Origin: app/backend/core/src/plugin_slide_markdown.rs::component_label


pub(super) fn component_label(kind: &str) -> Option<&'static str> {
    Some(match kind {
        "hero" => "主标题",
        "mind-map" => "思维导图",
        "serpentine-process" => "半圆折返流程",
        "recycling-arrows" => "三向折叠循环",
        "vertical-progress" => "竖向百分比进度",
        "icon-columns" => "大图标说明",
        "badge-cards" => "交错徽章卡片",
        "3d-funnel" => "3D 漏斗",
        "concentric-circles" => "靶心 Bullseye",
        "layered-funnel" => "竖向分层漏斗",
        "folded-arrow" => "折叠上升箭头",
        "wave-arrow" => "波浪上升箭头",
        "layered-cube" => "立体分层柱",
        "double-ring" => "双环",
        "droplet-process" => "水滴箭头流程",
        "heading" => "标题",
        "text" => "正文",
        "text-panel" => "文字面板",
        "notice" => "提示",
        "quote" => "引用",
        "image-text" => "图文",
        "icon-text" => "图标文字",
        "stat" => "指标",
        "question-card" => "问题卡片",
        "media" => "图片",
        "code-block" => "代码",
        "math-formula" => "公式",
        "list" => "列表",
        "ordered-list" => "有序列表",
        "todo-list" => "待办",
        "contents" | "item-cards" | "shape-contents" | "capability-cards" | "numbered-icon-cards" => "卡片",

        "table" => "表格",
        "grouped-bar-chart" => "分组柱状图",
        "stacked-bar-chart" => "堆叠柱状图",
        "line-chart" => "折线图",
        "radar-chart" => "雷达图",
        "donut-chart" => "环形图",
        "risk-matrix" => "风险矩阵",
        "waterfall-chart" => "瀑布图",

        _ => return None,
    })
}
