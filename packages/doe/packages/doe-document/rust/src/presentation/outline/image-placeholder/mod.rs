use serde_json::Value;


use doe_core::asset::generated::{GeneratedImageType, PRODUCT_IMAGE_RATIOS};


pub const DEFAULT_DOE_OUTLINE_IMAGE_RATIO: &str = "16:9";

const MAX_IMAGE_PROMPT_CHARS: usize = 16_000;

const EXPECTED_MARKER_NAME: &str = "generateimg";

const CANONICAL_MARKER_NAME: &str = "GENRATEIMG";

const MAX_MARKER_NAME_EDIT_DISTANCE: usize = 2;

const LEGACY_MARKER_PREFIX: &str = "GENRATEIMG(";

const CONFIGURED_MARKER_PREFIX: &str = "GENRATEIMG[ratio=";

const TYPED_MARKER_PREFIX: &str = "GENRATEIMG[type=";


#[derive(Debug, Clone, PartialEq, Eq)]
struct ParsedDoeImageSource {
    prompt: String,
    ratio: String,
    image_type: GeneratedImageType,
}


#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DoeOutlineImagePlaceholder {
    pub json_pointer: String,
    pub source: String,
    pub prompt: String,
    pub ratio: String,
    pub image_type: GeneratedImageType,
}
#[path = "scan/mod.rs"]
mod function_scan;
pub use function_scan::scan;

#[path = "replace-source/mod.rs"]
mod function_replace_source;
pub use function_replace_source::replace_source;

#[path = "parse-source/mod.rs"]
mod function_parse_source;
pub use function_parse_source::parse_source;

#[path = "parse-doe-source/mod.rs"]
mod function_parse_doe_source;
 use function_parse_doe_source::parse_doe_source;

#[path = "normalize-marker-source/mod.rs"]
mod function_normalize_marker_source;
pub use function_normalize_marker_source::normalize_marker_source;

#[path = "bounded-edit-distance/mod.rs"]
mod function_bounded_edit_distance;
 use function_bounded_edit_distance::bounded_edit_distance;

#[path = "parse-prompt-body/mod.rs"]
mod function_parse_prompt_body;
 use function_parse_prompt_body::parse_prompt_body;

#[path = "marker-syntax-error/mod.rs"]
mod function_marker_syntax_error;
 use function_marker_syntax_error::marker_syntax_error;



#[cfg(test)]
#[path = "tests/mod.rs"]
mod tests;

