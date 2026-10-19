#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum JsonCodeFence<'a> {
    NotPresent,
    Removed(&'a str),
}
#[path = "strip-unique-json-code-fence/mod.rs"]
mod function_strip_unique_json_code_fence;
pub(super) use function_strip_unique_json_code_fence::strip_unique_json_code_fence;

#[path = "contains-nested-fence/mod.rs"]
mod function_contains_nested_fence;
 use function_contains_nested_fence::contains_nested_fence;

#[path = "invalid-json-fence/mod.rs"]
mod function_invalid_json_fence;
 use function_invalid_json_fence::invalid_json_fence;

