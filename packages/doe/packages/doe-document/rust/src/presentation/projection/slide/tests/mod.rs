use super::*;

use serde_json::json;
#[path = "page/mod.rs"]
mod function_page;
 use function_page::page;

#[path = "node/mod.rs"]
mod function_node;
 use function_node::node;

#[path = "output/mod.rs"]
mod function_output;
 use function_output::output;

#[path = "every-supported-component-has-an-explicit-projection/mod.rs"]
mod function_every_supported_component_has_an_explicit_projection;

#[path = "projections-preserve-component-content-and-relationships/mod.rs"]
mod function_projections_preserve_component_content_and_relationships;

#[path = "preserves-page-order-groups-and-does-not-serialize-private-fields/mod.rs"]
mod function_preserves_page_order_groups_and_does_not_serialize_private_fields;

#[path = "code-and-cells-cannot-break-their-markdown-containers/mod.rs"]
mod function_code_and_cells_cannot_break_their_markdown_containers;

#[path = "malformed-and-oversized-pages-fail-explicitly/mod.rs"]
mod function_malformed_and_oversized_pages_fail_explicitly;

