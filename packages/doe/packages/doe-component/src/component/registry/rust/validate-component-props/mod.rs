// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_component_props
use crate::schema::*;


pub fn validate_component_props(
    component_type: &str,
    props: &Map<String, Value>,
    path: &str,
) -> Result<(), String> {
    reject_theme_managed_component_styles(&Value::Object(props.clone()), path)?;
    match component_type {
        "mind-map" => mind_map_validate(props,path),
        "hero" => validate_component_props_hero(props, path),
        "heading" => validate_component_props_heading(props, path),
        "text-panel" | "text" | "notice" => validate_component_props_text_notice(props, path),
        "image-text" | "icon-text" => validate_component_props_image_text_icon_text(component_type, props, path),
        "contents" => validate_component_props_contents(props, path),
        "shape-contents" => validate_component_props_shape_contents(props, path),
        "3d-funnel" => funnel_3d_validate(props, path),
        "concentric-circles" | "layered-funnel" | "folded-arrow" | "wave-arrow" | "layered-cube" | "double-ring" | "droplet-process" | "serpentine-process" | "recycling-arrows" | "vertical-progress" | "icon-columns" | "badge-cards" => diagram_validate(component_type, props, path),
        "item-cards" => validate_component_props_item_cards(props, path),
        "todo-list" => validate_component_props_todo_list(props, path),
        "code-block" => validate_component_props_code_block(props, path),
        "list" | "ordered-list" => validate_component_props_list_ordered_list(props, path),
        "question-card" => validate_component_props_question_card(props, path),
        "stat" => validate_component_props_stat(props, path),
        "quote" => validate_component_props_quote(props, path),
        "media" => validate_component_props_media(props, path),
        "table" => validate_component_props_table(props, path),
        "grouped-bar-chart" | "line-chart" | "stacked-bar-chart" => validate_component_props_grouped_bar_chart_line_chart_stacked_bar_chart(props, path),
        "radar-chart" => validate_component_props_radar_chart(props, path),
        "donut-chart" => validate_component_props_donut_chart(props, path),
        "risk-matrix" => validate_component_props_risk_matrix(props, path),
        "waterfall-chart" => validate_component_props_waterfall_chart(props, path),

        "capability-cards" => validate_component_props_capability_cards(props, path),
        "numbered-icon-cards" => validate_component_props_numbered_icon_cards(props, path),
        "math-formula" => validate_component_props_math_formula(props, path),
        _ => mismatch(format!("{path} uses an unsupported component")),
    }
}
