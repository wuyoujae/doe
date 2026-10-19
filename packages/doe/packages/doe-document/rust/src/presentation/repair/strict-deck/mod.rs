use crate::presentation::schema::contract::{
    self as slide_agent_output_contract, ParsedSlideDeck, SlideDeckExpectations, EMPTY_OUTPUT_ERROR, INVALID_JSON_ERROR,
    MAX_OUTPUT_BYTES, OUTPUT_TOO_LARGE_ERROR, SCHEMA_MISMATCH_ERROR,
};


pub(super) struct StrictDeckOutput {
    pub parsed: ParsedSlideDeck,
    pub output: String,
    pub json_syntax_repaired: bool,
    pub theme_managed_fields_removed: bool,
    pub component_content_shapes_normalized: bool,
    pub storage_shape_normalized: bool,
}
#[path = "parse/mod.rs"]
mod function_parse;
pub(super) use function_parse::parse;

