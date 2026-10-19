use crate::schema::*;


pub(super) const PRESENTATIONS: &[&str] = &[
    "metrics",
    "cards:filled",
    "cards:filled-icon",
    "cards:outline",
    "cards:side-rule",
    "cards:top-rule",
    "cards:top-icon",
    "cards:connected",
    "cards:connected-icon",
    "cards:leaf",
    "cards:quote",
    "cards:bubble",
    "icon-text",
    "image-text",
    "alternating",
    "dot-card",
    "dot-list",
    "numbered-parallelogram",
    "numbered-pill",
    "numbered-chevron",
    "ascending-bar",
    "ascending-arrow",
    "ascending-numbered",
    "numbered-top-rule",
    "numbered-inline",
    "timeline-numbered",
    "timeline-dots",
    "timeline-dot-cards",

    "icon-horizontal",
    "list:unordered",
    "list:ordered",
    "shape:semicircle",
    "shape:petals",
    "shape:cycle-arrows",
    "shape:full-circle",
    "shape:ring",
    "shape:stairs",
    "shape:pyramid",
    "shape:inverted-pyramid",
    "capability",
    "numbered",
    "question",
    "quotation",
    "columns",
];

const PROPS: &[&str] = &[
    "items",
    "presentation",
    "title",
    "subtitle",
    "itemColumns",
    "itemLayout",
    "columnPreference",
    "orientation",
    "staggered",
    "connectors",
    "imageSize",
    "imageFit",
    "imageAspectRatio",
    "surface",
];

const ITEM: &[&str] = &["id", "title", "text", "icon", "src", "alt", "source", "label", "bullets"];
#[path = "present/mod.rs"]
mod function_present;
 use function_present::present;

#[path = "optional-text/mod.rs"]
mod function_optional_text;
 use function_optional_text::optional_text;

#[path = "response-schema/mod.rs"]
mod function_response_schema;
pub(super) use function_response_schema::response_schema;

#[path = "validate/mod.rs"]
mod function_validate;
pub(super) use function_validate::validate;



#[cfg(test)]
#[path = "tests/mod.rs"]
mod tests;
