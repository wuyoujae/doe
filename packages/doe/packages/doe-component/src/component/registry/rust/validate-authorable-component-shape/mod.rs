// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_component_shape
use crate::schema::*;


pub fn validate_authorable_component_shape(
    component_type: &str,
    props: &Map<String, Value>,
    path: &str,
) -> Result<(), String> {
    match component_type {
        "mind-map" => mind_map_shape(props,path),
        "hero" => validate_authorable_component_shape_hero(props, path),
        "heading" => validate_authorable_component_shape_heading(props, path),
        "text-panel" | "text" => validate_authorable_component_shape_text(props, path),
        "code-block" => validate_authorable_component_shape_code_block(props, path),
        "notice" => validate_authorable_component_shape_notice(props, path),
        "contents" => validate_authorable_component_shape_contents(props, path),
        "shape-contents" => validate_authorable_component_shape_shape_contents(props, path),
        "3d-funnel" => funnel_3d_shape(props, path),
        "concentric-circles" | "layered-funnel" | "folded-arrow" | "wave-arrow" | "layered-cube" | "double-ring" | "droplet-process" | "serpentine-process" | "recycling-arrows" | "vertical-progress" | "icon-columns" | "badge-cards" => diagram_shape(component_type, props, path),
        "item-cards" => validate_authorable_component_shape_item_cards(props, path),
        "todo-list" => validate_authorable_component_shape_todo_list(props, path),
        "list" | "ordered-list" => validate_authorable_component_shape_list_ordered_list(props, path),
        "question-card" => validate_authorable_component_shape_question_card(props, path),
        "image-text" => validate_authorable_component_shape_image_text(props, path),
        "icon-text" => validate_authorable_component_shape_icon_text(props, path),
        "stat" => validate_authorable_component_shape_stat(props, path),
        "quote" => validate_authorable_component_shape_quote(props, path),
        "media" => validate_authorable_component_shape_media(props, path),
        "table" => validate_authorable_component_shape_table(props, path),
        "grouped-bar-chart" => validate_authorable_component_shape_grouped_bar_chart(props, path),
        "line-chart" => validate_authorable_component_shape_line_chart(props, path),
        "stacked-bar-chart" => validate_authorable_component_shape_stacked_bar_chart(props, path),
        "radar-chart" => validate_authorable_component_shape_radar_chart(props, path),
        "donut-chart" => validate_authorable_component_shape_donut_chart(props, path),
        "risk-matrix" => validate_authorable_component_shape_risk_matrix(props, path),
        "waterfall-chart" => validate_authorable_component_shape_waterfall_chart(props, path),


        "capability-cards" => validate_authorable_component_shape_capability_cards(props, path),
        "numbered-icon-cards" => validate_authorable_component_shape_numbered_icon_cards(props, path),
        "math-formula" => validate_authorable_component_shape_math_formula(props, path),
        _ => mismatch(format!("{path} uses an unsupported authoring component")),
    }
}
