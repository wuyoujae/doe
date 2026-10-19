// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_component_values
use crate::schema::*;


pub fn validate_authorable_component_values(
    component_type: &str,
    props: &Map<String, Value>,
    path: &str,
) -> Result<(), String> {
    match component_type {
        "mind-map" => mind_map_validate(props,path),
        "hero" => validate_authorable_component_values_hero(props, path),
        "heading" => validate_authorable_component_values_heading(props, path),
        "text-panel" | "text" => validate_authorable_component_values_text(props, path),
        "code-block" => validate_authorable_component_values_code_block(props, path),
        "image-text" => validate_authorable_component_values_image_text(props, path),
        "icon-text" => validate_authorable_component_values_icon_text(),
        "contents" => validate_authorable_component_values_contents(props, path),
        "shape-contents" => validate_authorable_component_values_shape_contents(props, path),
        "3d-funnel" => funnel_3d_validate(props, path),
        "concentric-circles" | "layered-funnel" | "folded-arrow" | "wave-arrow" | "layered-cube" | "double-ring" | "droplet-process" | "serpentine-process" | "recycling-arrows" | "vertical-progress" | "icon-columns" | "badge-cards" => diagram_validate(component_type, props, path),
        "item-cards" => validate_authorable_component_values_item_cards(props, path),
        "list" | "ordered-list" | "todo-list" => validate_authorable_component_values_list_ordered_list_todo_list(props, path),
        "question-card" => validate_authorable_component_values_question_card(props, path),
        "stat" => validate_authorable_component_values_stat(props, path),
        "quote" => validate_authorable_component_values_quote(props, path),
        "notice" => validate_authorable_component_values_notice(props, path),
        "media" => validate_authorable_component_values_media(props, path),
        "table" => validate_authorable_component_values_table(props, path),
        "grouped-bar-chart" | "line-chart" | "stacked-bar-chart" => validate_authorable_component_values_grouped_bar_chart_line_chart_stacked_bar_chart(component_type, props, path),
        "radar-chart" => validate_authorable_component_values_radar_chart(props, path),
        "donut-chart" => validate_authorable_component_values_donut_chart(props, path),
        "risk-matrix" => validate_authorable_component_values_risk_matrix(props, path),
        "waterfall-chart" => validate_authorable_component_values_waterfall_chart(props, path),


        "capability-cards" | "numbered-icon-cards" => validate_authorable_component_values_capability_cards_numbered_icon_cards(component_type, props, path),
        "math-formula" => validate_authorable_component_values_math_formula(props, path),
        _ => mismatch(format!("{path} uses an unsupported authoring component")),
    }
}
