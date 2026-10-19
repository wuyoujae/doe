//! DOE content projection. Traverse only documented nodes/fields, never arbitrary JSON.
use crate::presentation::projection::outline::{redact_text, safe_text};

use serde_json::Value;


const UNAVAILABLE: &str = "slide_unavailable";

const TOO_LARGE: &str = "slide_too_large";

const MAX_OUTPUT: usize = 120_000;
#[path = "array/mod.rs"]
mod function_array;
 use function_array::array;

#[path = "scalar/mod.rs"]
mod function_scalar;
 use function_scalar::scalar;

#[path = "collect-ids/mod.rs"]
mod function_collect_ids;
 use function_collect_ids::collect_ids;

#[path = "render/mod.rs"]
mod function_render;
pub use function_render::render;

#[path = "first-heading/mod.rs"]
mod function_first_heading;
 use function_first_heading::first_heading;



struct Writer<'a> {
    out: String,
    ids: &'a [&'a str],
    cells: usize,
}

#[path = "writer/add/mod.rs"]
mod writer_add;
#[path = "writer/text/mod.rs"]
mod writer_text;
#[path = "writer/heading/mod.rs"]
mod writer_heading;
#[path = "writer/field/mod.rs"]
mod writer_field;
#[path = "writer/row/mod.rs"]
mod writer_row;
#[path = "writer/table-header/mod.rs"]
mod writer_table_header;
#[path = "writer/list/mod.rs"]
mod writer_list;
#[path = "writer/objects/mod.rs"]
mod writer_objects;
#[path = "writer/fence/mod.rs"]
mod writer_fence;
#[path = "writer/units/mod.rs"]
mod writer_units;
#[path = "writer/node/mod.rs"]
mod writer_node;
#[path = "writer/required/mod.rs"]
mod writer_required;
#[path = "writer/annotation/mod.rs"]
mod writer_annotation;
#[path = "writer/series/mod.rs"]
mod writer_series;
#[path = "component-label/mod.rs"]
mod function_component_label;
 use function_component_label::component_label;



#[cfg(test)]
mod tests;
