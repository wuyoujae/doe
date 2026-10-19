use super::*;
#[path = "cases/mod.rs"]
mod function_cases;
 use function_cases::cases;

#[path = "page/mod.rs"]
mod function_page;
 use function_page::page;

#[path = "all-authoring-examples-pass-without-mutation/mod.rs"]
mod function_all_authoring_examples_pass_without_mutation;

#[path = "stringified-containers-fail-at-the-actual-path/mod.rs"]
mod function_stringified_containers_fail_at_the_actual_path;

#[path = "invalid-components-values-and-relations-are-rejected/mod.rs"]
mod function_invalid_components_values_and_relations_are_rejected;

#[path = "optional-container-type-errors-never-panic/mod.rs"]
mod function_optional_container_type_errors_never_panic;

#[path = "nested-notice-and-invalid-edge-media-are-rejected/mod.rs"]
mod function_nested_notice_and_invalid_edge_media_are_rejected;

#[path = "runtime-fields-and-legitimate-code-strings-remain-unchanged/mod.rs"]
mod function_runtime_fields_and_legitimate_code_strings_remain_unchanged;

