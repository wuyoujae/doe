use serde_json::{json, Map, Value};
use std::collections::HashSet;

#[path = "../../../src/component/diagrams/3d-funnel/schema.rs"]
mod funnel_3d;
use funnel_3d::*;
#[path = "../../../src/component/diagrams/shared/schema.rs"]
mod diagrams;
use diagrams::*;
#[path = "../../../src/component/charts/mind-map/schema.rs"]
mod mind_map;
pub use mind_map::mind_map_validate;
use mind_map::{mind_map_response,mind_map_shape};

#[path = "../../../src/component/contents/contents/schema/rust/contract/mod.rs"]
mod contents;
const THEME_MANAGED_COMPONENT_STYLE_KEYS: &[&str] = &[
    "style",
    "styles",
    "class",
    "className",
    "css",
    "cssText",
    "theme",
    "font",
    "fontFamily",
    "fontSize",
    "fontSizePt",
    "fontStyle",
    "fontWeight",
    "lineHeight",
    "letterSpacing",
    "typography",
    "textStyle",
    "textAlign",
    "textDecoration",
    "bold",
    "color",
    "colors",
    "palette",
    "background",
    "backgroundColor",
    "backgroundImage",
    "fill",
    "stroke",
    "textColor",
    "lineColor",
    "gridColor",
    "axisColor",
    "accentColor",
    "borderColor",
    "labelColor",
    "badgeColor",
    "separatorColor",
    "centerColor",
    "positiveColor",
    "negativeColor",
    "totalColor",
    "endColor",
    "bandColors",
    "itemColors",
    "nodeColor",
    "upperColor",
    "lowerColor",
    "border",
    "strokeWidth",
    "borderWidth",
    "separatorWidth",
    "fillOpacity",
    "opacity",
    "radius",
    "borderRadius",
    "cornerRadius",
    "shadow",
    "boxShadow",
    "elevation",
    "mask",
    "maskImage",
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "margin",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "iconSize",
    "iconStrokeWidth",
    "textFit",
    "minTitlePt",
    "minBodyPt",
    "optionalMinBodyPt",
    "allowEmergency8Pt",
];
pub const SCHEMA_MISMATCH_ERROR: &str = "slide_agent_schema_mismatch";

#[path = "../../../src/component/shared/schema/rust/allowed-keys/mod.rs"]
mod function_allowed_keys;
pub use function_allowed_keys::allowed_keys;

#[path = "../../../src/component/shared/schema/rust/array/mod.rs"]
mod function_array;
pub use function_array::array;

#[path = "../../../src/component/shared/schema/rust/authorable-content/mod.rs"]
mod function_authorable_content;
pub use function_authorable_content::authorable_content;

#[path = "../../../src/component/shared/schema/rust/collection-props-response-schema/mod.rs"]
mod function_collection_props_response_schema;
pub use function_collection_props_response_schema::collection_props_response_schema;

#[path = "../../../src/component/registry/rust/component-props-response-schema/mod.rs"]
mod function_component_props_response_schema;
pub use function_component_props_response_schema::component_props_response_schema;

#[path = "../../../src/component/shared/schema/rust/content-object/mod.rs"]
mod function_content_object;
pub use function_content_object::content_object;

#[path = "../../../src/component/shared/schema/rust/finite-number/mod.rs"]
mod function_finite_number;
pub use function_finite_number::finite_number;

#[path = "../../../src/component/shared/schema/rust/is-theme-managed-component-style-key/mod.rs"]
mod function_is_theme_managed_component_style_key;
pub use function_is_theme_managed_component_style_key::is_theme_managed_component_style_key;

#[path = "../../../src/component/shared/schema/rust/mismatch/mod.rs"]
mod function_mismatch;
pub use function_mismatch::mismatch;

#[path = "../../../src/component/shared/schema/rust/nonempty-text/mod.rs"]
mod function_nonempty_text;
pub use function_nonempty_text::nonempty_text;

#[path = "../../../src/component/shared/schema/rust/number/mod.rs"]
mod function_number;
pub use function_number::number;

#[path = "../../../src/component/shared/schema/rust/object/mod.rs"]
mod function_object;
pub use function_object::object;

#[path = "../../../src/component/charts/radar-chart/schema/rust/radar-chart-props-response-schema/mod.rs"]
mod function_radar_chart_props_response_schema;
pub use function_radar_chart_props_response_schema::radar_chart_props_response_schema;

#[path = "../../../src/component/shared/schema/rust/reject-theme-managed-component-styles/mod.rs"]
mod function_reject_theme_managed_component_styles;
pub use function_reject_theme_managed_component_styles::reject_theme_managed_component_styles;

#[path = "../../../src/component/shared/schema/rust/required/mod.rs"]
mod function_required;
pub use function_required::required;

#[path = "../../../src/component/shared/schema/rust/required-props/mod.rs"]
mod function_required_props;
pub use function_required_props::required_props;

#[path = "../../../src/component/shared/schema/rust/required-text/mod.rs"]
mod function_required_text;
pub use function_required_text::required_text;

#[path = "../../../src/component/shared/schema/rust/series-chart-props-response-schema/mod.rs"]
mod function_series_chart_props_response_schema;
pub use function_series_chart_props_response_schema::series_chart_props_response_schema;

#[path = "../../../src/component/shared/schema/rust/string-array/mod.rs"]
mod function_string_array;
pub use function_string_array::string_array;

#[path = "../../../src/component/shared/schema/rust/string-or-number/mod.rs"]
mod function_string_or_number;
pub use function_string_or_number::string_or_number;

#[path = "../../../src/component/charts/table/schema/rust/table-props-response-schema/mod.rs"]
mod function_table_props_response_schema;
pub use function_table_props_response_schema::table_props_response_schema;

#[path = "../../../src/component/shared/schema/rust/text-response-schema/mod.rs"]
mod function_text_response_schema;
pub use function_text_response_schema::text_response_schema;

#[path = "../../../src/component/registry/rust/validate-authorable-component-shape/mod.rs"]
mod function_validate_authorable_component_shape;
pub use function_validate_authorable_component_shape::validate_authorable_component_shape;

#[path = "../../../src/component/registry/rust/validate-authorable-component-values/mod.rs"]
mod function_validate_authorable_component_values;
pub use function_validate_authorable_component_values::validate_authorable_component_values;

#[path = "../../../src/component/charts/donut-chart/schema/rust/validate-authorable-donut-values/mod.rs"]
mod function_validate_authorable_donut_values;
pub use function_validate_authorable_donut_values::validate_authorable_donut_values;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-enum/mod.rs"]
mod function_validate_authorable_enum;
pub use function_validate_authorable_enum::validate_authorable_enum;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-integer-range/mod.rs"]
mod function_validate_authorable_integer_range;
pub use function_validate_authorable_integer_range::validate_authorable_integer_range;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-object-items/mod.rs"]
mod function_validate_authorable_object_items;
pub use function_validate_authorable_object_items::validate_authorable_object_items;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-optional-bool/mod.rs"]
mod function_validate_authorable_optional_bool;
pub use function_validate_authorable_optional_bool::validate_authorable_optional_bool;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-optional-enum/mod.rs"]
mod function_validate_authorable_optional_enum;
pub use function_validate_authorable_optional_enum::validate_authorable_optional_enum;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-optional-integer-range/mod.rs"]
mod function_validate_authorable_optional_integer_range;
pub use function_validate_authorable_optional_integer_range::validate_authorable_optional_integer_range;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-optional-number/mod.rs"]
mod function_validate_authorable_optional_number;
pub use function_validate_authorable_optional_number::validate_authorable_optional_number;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-optional-object/mod.rs"]
mod function_validate_authorable_optional_object;
pub use function_validate_authorable_optional_object::validate_authorable_optional_object;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-optional-string-array/mod.rs"]
mod function_validate_authorable_optional_string_array;
pub use function_validate_authorable_optional_string_array::validate_authorable_optional_string_array;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-optional-string-or-number/mod.rs"]
mod function_validate_authorable_optional_string_or_number;
pub use function_validate_authorable_optional_string_or_number::validate_authorable_optional_string_or_number;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-optional-text/mod.rs"]
mod function_validate_authorable_optional_text;
pub use function_validate_authorable_optional_text::validate_authorable_optional_text;

#[path = "../../../src/component/charts/radar-chart/schema/rust/validate-authorable-radar-values/mod.rs"]
mod function_validate_authorable_radar_values;
pub use function_validate_authorable_radar_values::validate_authorable_radar_values;

#[path = "../../../src/component/charts/risk-matrix/schema/rust/validate-authorable-risk-values/mod.rs"]
mod function_validate_authorable_risk_values;
pub use function_validate_authorable_risk_values::validate_authorable_risk_values;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-series-chart-values/mod.rs"]
mod function_validate_authorable_series_chart_values;
pub use function_validate_authorable_series_chart_values::validate_authorable_series_chart_values;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-string-array/mod.rs"]
mod function_validate_authorable_string_array;
pub use function_validate_authorable_string_array::validate_authorable_string_array;

#[path = "../../../src/component/shared/schema/rust/validate-authorable-string-or-string-array/mod.rs"]
mod function_validate_authorable_string_or_string_array;
pub use function_validate_authorable_string_or_string_array::validate_authorable_string_or_string_array;

#[path = "../../../src/component/charts/table/schema/rust/validate-authorable-table-values/mod.rs"]
mod function_validate_authorable_table_values;
pub use function_validate_authorable_table_values::validate_authorable_table_values;

#[path = "../../../src/component/charts/waterfall-chart/schema/rust/validate-authorable-waterfall-values/mod.rs"]
mod function_validate_authorable_waterfall_values;
pub use function_validate_authorable_waterfall_values::validate_authorable_waterfall_values;

#[path = "../../../src/component/shared/schema/rust/validate-axis-cross-fields/mod.rs"]
mod function_validate_axis_cross_fields;
pub use function_validate_axis_cross_fields::validate_axis_cross_fields;

#[path = "../../../src/component/shared/schema/rust/validate-bounded-index/mod.rs"]
mod function_validate_bounded_index;
pub use function_validate_bounded_index::validate_bounded_index;

#[path = "../../../src/component/registry/rust/validate-component-props/mod.rs"]
mod function_validate_component_props;
pub use function_validate_component_props::validate_component_props;

#[path = "../../../src/component/shared/schema/rust/validate-object-items/mod.rs"]
mod function_validate_object_items;
pub use function_validate_object_items::validate_object_items;

#[path = "../../../src/component/charts/radar-chart/schema/rust/validate-radar-chart/mod.rs"]
mod function_validate_radar_chart;
pub use function_validate_radar_chart::validate_radar_chart;

#[path = "../../../src/component/charts/risk-matrix/schema/rust/validate-risk-priority-zone/mod.rs"]
mod function_validate_risk_priority_zone;
pub use function_validate_risk_priority_zone::validate_risk_priority_zone;

#[path = "../../../src/component/shared/schema/rust/validate-series-chart/mod.rs"]
mod function_validate_series_chart;
pub use function_validate_series_chart::validate_series_chart;

#[path = "../../../src/component/charts/table/schema/rust/validate-table/mod.rs"]
mod function_validate_table;
pub use function_validate_table::validate_table;

#[path = "../../../src/component/charts/waterfall-chart/schema/rust/validate-waterfall-cross-fields/mod.rs"]
mod function_validate_waterfall_cross_fields;
pub use function_validate_waterfall_cross_fields::validate_waterfall_cross_fields;

#[path = "../../../src/component/base/hero/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_hero;
use function_component_props_response_schema_hero::component_props_response_schema_hero;

#[path = "../../../src/component/shared/heading-text-quote-notice/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_heading_text_quote_notice;
use function_component_props_response_schema_heading_text_quote_notice::component_props_response_schema_heading_text_quote_notice;

#[path = "../../../src/component/base/code-block/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_code_block;
use function_component_props_response_schema_code_block::component_props_response_schema_code_block;

#[path = "../../../src/component/shared/list-ordered-list/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_list_ordered_list;
use function_component_props_response_schema_list_ordered_list::component_props_response_schema_list_ordered_list;

#[path = "../../../src/component/contents/image-text/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_image_text;
use function_component_props_response_schema_image_text::component_props_response_schema_image_text;

#[path = "../../../src/component/contents/icon-text/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_icon_text;
use function_component_props_response_schema_icon_text::component_props_response_schema_icon_text;


#[path = "../../../src/component/contents/contents/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_contents;
use function_component_props_response_schema_contents::component_props_response_schema_contents;

#[path = "../../../src/component/contents/shape-contents/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_shape_contents;
use function_component_props_response_schema_shape_contents::component_props_response_schema_shape_contents;

#[path = "../../../src/component/contents/item-cards/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_item_cards;
use function_component_props_response_schema_item_cards::component_props_response_schema_item_cards;

#[path = "../../../src/component/base/todo-list/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_todo_list;
use function_component_props_response_schema_todo_list::component_props_response_schema_todo_list;

#[path = "../../../src/component/contents/question-card/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_question_card;
use function_component_props_response_schema_question_card::component_props_response_schema_question_card;

#[path = "../../../src/component/base/stat/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_stat;
use function_component_props_response_schema_stat::component_props_response_schema_stat;

#[path = "../../../src/component/base/media/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_media;
use function_component_props_response_schema_media::component_props_response_schema_media;


#[path = "../../../src/component/charts/table/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_table;
use function_component_props_response_schema_table::component_props_response_schema_table;

#[path = "../../../src/component/shared/grouped-bar-chart-stacked-bar-chart/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_grouped_bar_chart_stacked_bar_chart;
use function_component_props_response_schema_grouped_bar_chart_stacked_bar_chart::component_props_response_schema_grouped_bar_chart_stacked_bar_chart;

#[path = "../../../src/component/charts/line-chart/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_line_chart;
use function_component_props_response_schema_line_chart::component_props_response_schema_line_chart;

#[path = "../../../src/component/charts/radar-chart/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_radar_chart;
use function_component_props_response_schema_radar_chart::component_props_response_schema_radar_chart;

#[path = "../../../src/component/charts/donut-chart/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_donut_chart;
use function_component_props_response_schema_donut_chart::component_props_response_schema_donut_chart;

#[path = "../../../src/component/charts/risk-matrix/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_risk_matrix;
use function_component_props_response_schema_risk_matrix::component_props_response_schema_risk_matrix;

#[path = "../../../src/component/charts/waterfall-chart/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_waterfall_chart;
use function_component_props_response_schema_waterfall_chart::component_props_response_schema_waterfall_chart;









#[path = "../../../src/component/contents/capability-cards/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_capability_cards;
use function_component_props_response_schema_capability_cards::component_props_response_schema_capability_cards;

#[path = "../../../src/component/contents/numbered-icon-cards/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_numbered_icon_cards;
use function_component_props_response_schema_numbered_icon_cards::component_props_response_schema_numbered_icon_cards;


#[path = "../../../src/component/base/math-formula/schema/rust/response/mod.rs"]
mod function_component_props_response_schema_math_formula;
use function_component_props_response_schema_math_formula::component_props_response_schema_math_formula;

#[path = "../../../src/component/base/hero/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_hero;
use function_validate_authorable_component_shape_hero::validate_authorable_component_shape_hero;

#[path = "../../../src/component/base/heading/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_heading;
use function_validate_authorable_component_shape_heading::validate_authorable_component_shape_heading;

#[path = "../../../src/component/base/text/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_text;
use function_validate_authorable_component_shape_text::validate_authorable_component_shape_text;

#[path = "../../../src/component/base/code-block/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_code_block;
use function_validate_authorable_component_shape_code_block::validate_authorable_component_shape_code_block;

#[path = "../../../src/component/base/notice/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_notice;
use function_validate_authorable_component_shape_notice::validate_authorable_component_shape_notice;

#[path = "../../../src/component/contents/contents/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_contents;
use function_validate_authorable_component_shape_contents::validate_authorable_component_shape_contents;

#[path = "../../../src/component/contents/shape-contents/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_shape_contents;
use function_validate_authorable_component_shape_shape_contents::validate_authorable_component_shape_shape_contents;

#[path = "../../../src/component/contents/item-cards/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_item_cards;
use function_validate_authorable_component_shape_item_cards::validate_authorable_component_shape_item_cards;

#[path = "../../../src/component/base/todo-list/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_todo_list;
use function_validate_authorable_component_shape_todo_list::validate_authorable_component_shape_todo_list;

#[path = "../../../src/component/shared/list-ordered-list/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_list_ordered_list;
use function_validate_authorable_component_shape_list_ordered_list::validate_authorable_component_shape_list_ordered_list;

#[path = "../../../src/component/contents/question-card/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_question_card;
use function_validate_authorable_component_shape_question_card::validate_authorable_component_shape_question_card;

#[path = "../../../src/component/contents/image-text/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_image_text;
use function_validate_authorable_component_shape_image_text::validate_authorable_component_shape_image_text;

#[path = "../../../src/component/contents/icon-text/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_icon_text;
use function_validate_authorable_component_shape_icon_text::validate_authorable_component_shape_icon_text;

#[path = "../../../src/component/base/stat/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_stat;
use function_validate_authorable_component_shape_stat::validate_authorable_component_shape_stat;

#[path = "../../../src/component/contents/quote/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_quote;
use function_validate_authorable_component_shape_quote::validate_authorable_component_shape_quote;

#[path = "../../../src/component/base/media/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_media;
use function_validate_authorable_component_shape_media::validate_authorable_component_shape_media;


#[path = "../../../src/component/charts/table/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_table;
use function_validate_authorable_component_shape_table::validate_authorable_component_shape_table;

#[path = "../../../src/component/charts/grouped-bar-chart/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_grouped_bar_chart;
use function_validate_authorable_component_shape_grouped_bar_chart::validate_authorable_component_shape_grouped_bar_chart;

#[path = "../../../src/component/charts/line-chart/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_line_chart;
use function_validate_authorable_component_shape_line_chart::validate_authorable_component_shape_line_chart;

#[path = "../../../src/component/charts/stacked-bar-chart/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_stacked_bar_chart;
use function_validate_authorable_component_shape_stacked_bar_chart::validate_authorable_component_shape_stacked_bar_chart;

#[path = "../../../src/component/charts/radar-chart/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_radar_chart;
use function_validate_authorable_component_shape_radar_chart::validate_authorable_component_shape_radar_chart;

#[path = "../../../src/component/charts/donut-chart/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_donut_chart;
use function_validate_authorable_component_shape_donut_chart::validate_authorable_component_shape_donut_chart;

#[path = "../../../src/component/charts/risk-matrix/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_risk_matrix;
use function_validate_authorable_component_shape_risk_matrix::validate_authorable_component_shape_risk_matrix;

#[path = "../../../src/component/charts/waterfall-chart/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_waterfall_chart;
use function_validate_authorable_component_shape_waterfall_chart::validate_authorable_component_shape_waterfall_chart;








#[path = "../../../src/component/contents/capability-cards/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_capability_cards;
use function_validate_authorable_component_shape_capability_cards::validate_authorable_component_shape_capability_cards;

#[path = "../../../src/component/contents/numbered-icon-cards/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_numbered_icon_cards;
use function_validate_authorable_component_shape_numbered_icon_cards::validate_authorable_component_shape_numbered_icon_cards;


#[path = "../../../src/component/base/math-formula/schema/rust/validate-shape/mod.rs"]
mod function_validate_authorable_component_shape_math_formula;
use function_validate_authorable_component_shape_math_formula::validate_authorable_component_shape_math_formula;

#[path = "../../../src/component/base/hero/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_hero;
use function_validate_authorable_component_values_hero::validate_authorable_component_values_hero;

#[path = "../../../src/component/base/heading/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_heading;
use function_validate_authorable_component_values_heading::validate_authorable_component_values_heading;

#[path = "../../../src/component/base/text/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_text;
use function_validate_authorable_component_values_text::validate_authorable_component_values_text;

#[path = "../../../src/component/base/code-block/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_code_block;
use function_validate_authorable_component_values_code_block::validate_authorable_component_values_code_block;

#[path = "../../../src/component/contents/image-text/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_image_text;
use function_validate_authorable_component_values_image_text::validate_authorable_component_values_image_text;

#[path = "../../../src/component/contents/icon-text/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_icon_text;
use function_validate_authorable_component_values_icon_text::validate_authorable_component_values_icon_text;


#[path = "../../../src/component/contents/contents/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_contents;
use function_validate_authorable_component_values_contents::validate_authorable_component_values_contents;

#[path = "../../../src/component/contents/shape-contents/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_shape_contents;
use function_validate_authorable_component_values_shape_contents::validate_authorable_component_values_shape_contents;

#[path = "../../../src/component/contents/item-cards/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_item_cards;
use function_validate_authorable_component_values_item_cards::validate_authorable_component_values_item_cards;

#[path = "../../../src/component/shared/list-ordered-list-todo-list/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_list_ordered_list_todo_list;
use function_validate_authorable_component_values_list_ordered_list_todo_list::validate_authorable_component_values_list_ordered_list_todo_list;

#[path = "../../../src/component/contents/question-card/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_question_card;
use function_validate_authorable_component_values_question_card::validate_authorable_component_values_question_card;

#[path = "../../../src/component/base/stat/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_stat;
use function_validate_authorable_component_values_stat::validate_authorable_component_values_stat;

#[path = "../../../src/component/contents/quote/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_quote;
use function_validate_authorable_component_values_quote::validate_authorable_component_values_quote;

#[path = "../../../src/component/base/notice/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_notice;
use function_validate_authorable_component_values_notice::validate_authorable_component_values_notice;

#[path = "../../../src/component/base/media/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_media;
use function_validate_authorable_component_values_media::validate_authorable_component_values_media;


#[path = "../../../src/component/charts/table/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_table;
use function_validate_authorable_component_values_table::validate_authorable_component_values_table;

#[path = "../../../src/component/shared/grouped-bar-chart-line-chart-stacked-bar-chart/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_grouped_bar_chart_line_chart_stacked_bar_chart;
use function_validate_authorable_component_values_grouped_bar_chart_line_chart_stacked_bar_chart::validate_authorable_component_values_grouped_bar_chart_line_chart_stacked_bar_chart;

#[path = "../../../src/component/charts/radar-chart/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_radar_chart;
use function_validate_authorable_component_values_radar_chart::validate_authorable_component_values_radar_chart;

#[path = "../../../src/component/charts/donut-chart/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_donut_chart;
use function_validate_authorable_component_values_donut_chart::validate_authorable_component_values_donut_chart;

#[path = "../../../src/component/charts/risk-matrix/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_risk_matrix;
use function_validate_authorable_component_values_risk_matrix::validate_authorable_component_values_risk_matrix;

#[path = "../../../src/component/charts/waterfall-chart/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_waterfall_chart;
use function_validate_authorable_component_values_waterfall_chart::validate_authorable_component_values_waterfall_chart;







#[path = "../../../src/component/shared/capability-cards-numbered-icon-cards/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_capability_cards_numbered_icon_cards;
use function_validate_authorable_component_values_capability_cards_numbered_icon_cards::validate_authorable_component_values_capability_cards_numbered_icon_cards;


#[path = "../../../src/component/base/math-formula/schema/rust/validate-values/mod.rs"]
mod function_validate_authorable_component_values_math_formula;
use function_validate_authorable_component_values_math_formula::validate_authorable_component_values_math_formula;

#[path = "../../../src/component/base/hero/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_hero;
use function_validate_component_props_hero::validate_component_props_hero;

#[path = "../../../src/component/base/heading/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_heading;
use function_validate_component_props_heading::validate_component_props_heading;

#[path = "../../../src/component/shared/text-notice/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_text_notice;
use function_validate_component_props_text_notice::validate_component_props_text_notice;


#[path = "../../../src/component/shared/image-text-icon-text/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_image_text_icon_text;
use function_validate_component_props_image_text_icon_text::validate_component_props_image_text_icon_text;

#[path = "../../../src/component/contents/contents/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_contents;
use function_validate_component_props_contents::validate_component_props_contents;

#[path = "../../../src/component/contents/shape-contents/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_shape_contents;
use function_validate_component_props_shape_contents::validate_component_props_shape_contents;

#[path = "../../../src/component/contents/item-cards/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_item_cards;
use function_validate_component_props_item_cards::validate_component_props_item_cards;

#[path = "../../../src/component/base/todo-list/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_todo_list;
use function_validate_component_props_todo_list::validate_component_props_todo_list;

#[path = "../../../src/component/base/code-block/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_code_block;
use function_validate_component_props_code_block::validate_component_props_code_block;

#[path = "../../../src/component/shared/list-ordered-list/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_list_ordered_list;
use function_validate_component_props_list_ordered_list::validate_component_props_list_ordered_list;

#[path = "../../../src/component/contents/question-card/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_question_card;
use function_validate_component_props_question_card::validate_component_props_question_card;

#[path = "../../../src/component/base/stat/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_stat;
use function_validate_component_props_stat::validate_component_props_stat;

#[path = "../../../src/component/contents/quote/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_quote;
use function_validate_component_props_quote::validate_component_props_quote;

#[path = "../../../src/component/base/media/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_media;
use function_validate_component_props_media::validate_component_props_media;


#[path = "../../../src/component/charts/table/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_table;
use function_validate_component_props_table::validate_component_props_table;

#[path = "../../../src/component/shared/grouped-bar-chart-line-chart-stacked-bar-chart/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_grouped_bar_chart_line_chart_stacked_bar_chart;
use function_validate_component_props_grouped_bar_chart_line_chart_stacked_bar_chart::validate_component_props_grouped_bar_chart_line_chart_stacked_bar_chart;

#[path = "../../../src/component/charts/radar-chart/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_radar_chart;
use function_validate_component_props_radar_chart::validate_component_props_radar_chart;

#[path = "../../../src/component/charts/donut-chart/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_donut_chart;
use function_validate_component_props_donut_chart::validate_component_props_donut_chart;

#[path = "../../../src/component/charts/risk-matrix/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_risk_matrix;
use function_validate_component_props_risk_matrix::validate_component_props_risk_matrix;

#[path = "../../../src/component/charts/waterfall-chart/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_waterfall_chart;
use function_validate_component_props_waterfall_chart::validate_component_props_waterfall_chart;









#[path = "../../../src/component/contents/capability-cards/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_capability_cards;
use function_validate_component_props_capability_cards::validate_component_props_capability_cards;

#[path = "../../../src/component/contents/numbered-icon-cards/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_numbered_icon_cards;
use function_validate_component_props_numbered_icon_cards::validate_component_props_numbered_icon_cards;


#[path = "../../../src/component/base/math-formula/schema/rust/validate-content/mod.rs"]
mod function_validate_component_props_math_formula;
use function_validate_component_props_math_formula::validate_component_props_math_formula;
