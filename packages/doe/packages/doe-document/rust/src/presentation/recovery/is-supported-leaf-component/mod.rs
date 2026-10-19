// Origin: app/backend/core/src/slide_recovery/mod.rs::is_supported_leaf_component


pub(super) fn is_supported_leaf_component(value: &str) -> bool {
    matches!(
        value,
        "hero"
            | "heading"
            | "text"
            | "code-block"
            | "list"
            | "ordered-list"
            | "todo-list"
            | "item-cards"
            | "image-text"
            | "icon-text"
            | "shape-contents"
            | "mind-map" | "3d-funnel" | "concentric-circles" | "layered-funnel" | "folded-arrow" | "wave-arrow" | "layered-cube" | "double-ring" | "droplet-process" | "serpentine-process" | "recycling-arrows" | "vertical-progress" | "icon-columns" | "badge-cards"
            | "text-panel" | "notice"
            | "question-card"
            | "stat"
            | "quote"
            | "media"

            | "table"
            | "grouped-bar-chart"
            | "line-chart"
            | "stacked-bar-chart"
            | "risk-matrix"
            | "waterfall-chart"
            | "radar-chart"
            | "donut-chart"






            | "capability-cards"
            | "numbered-icon-cards"

            | "math-formula"
    )
}
