// Origin: app/backend/core/src/slide_recovery/mod.rs::resolve_schema_branch
use super::*;


pub(super) fn resolve_schema_branch<'a>(mut schema: &'a Value, value: &Value) -> &'a Value {
    while let Some(branch) = select_schema_branch(schema, value) {
        if std::ptr::eq(branch, schema) {
            break;
        }
        schema = branch;
    }
    schema
}
