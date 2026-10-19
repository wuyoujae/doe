// Origin: app/backend/core/src/slide_agent_output_contract.rs::component_props_response_schema
use crate::schema::*;


pub fn component_props_response_schema(component_type: &str) -> Value {
    match component_type {
        "mind-map" => mind_map_response(),
        "hero" => component_props_response_schema_hero(),
        "heading" | "text-panel" | "text" | "quote" | "notice" => component_props_response_schema_heading_text_quote_notice(component_type),
        "code-block" => component_props_response_schema_code_block(),
        "list" | "ordered-list" => component_props_response_schema_list_ordered_list(),
        "image-text" => component_props_response_schema_image_text(),
        "icon-text" => component_props_response_schema_icon_text(),
        "contents" => component_props_response_schema_contents(),
        "shape-contents" => component_props_response_schema_shape_contents(),
        "3d-funnel" => funnel_3d_response(),
        "concentric-circles" | "layered-funnel" | "folded-arrow" | "wave-arrow" | "layered-cube" | "double-ring" | "droplet-process" | "serpentine-process" | "recycling-arrows" | "vertical-progress" | "icon-columns" | "badge-cards" => diagram_response(component_type),
        "item-cards" => component_props_response_schema_item_cards(),
        "todo-list" => component_props_response_schema_todo_list(),
        "question-card" => component_props_response_schema_question_card(),
        "stat" => component_props_response_schema_stat(),
        "media" => component_props_response_schema_media(),
        "table" => component_props_response_schema_table(),
        "grouped-bar-chart" | "stacked-bar-chart" => component_props_response_schema_grouped_bar_chart_stacked_bar_chart(),
        "line-chart" => component_props_response_schema_line_chart(),
        "radar-chart" => component_props_response_schema_radar_chart(),
        "donut-chart" => component_props_response_schema_donut_chart(),
        "risk-matrix" => component_props_response_schema_risk_matrix(),
        "waterfall-chart" => component_props_response_schema_waterfall_chart(),

        "capability-cards" => component_props_response_schema_capability_cards(),
        "numbered-icon-cards" => component_props_response_schema_numbered_icon_cards(),
        "math-formula" => component_props_response_schema_math_formula(),
        _ => required_props(json!({}), &[]),
    }
}
