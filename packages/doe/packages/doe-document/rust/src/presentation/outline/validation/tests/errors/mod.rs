// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::errors
use super::*;


pub(super) fn errors(v: &Value) -> Failure {
    let mut e = Failure::from("validation_failed");
    outline(v, &mut e);
    e
}
