// Origin: app/backend/core/src/doe_slide_edit/validation.rs::prepare_candidate
use super::*;


pub fn prepare_candidate(before: &Snapshot, args: Value) -> Result<Value, Failure> {
    let edit = serde_json::from_value(args).map_err(|error| {
        let mut failure = crate::presentation::schema::safety::diagnostic(
            &format!("invalid_edit: root {error}"), "/arguments");
        failure.error = "doe_slide_edit_invalid_operations".into();
        failure.message = "EditSlide arguments are invalid; nothing was submitted.".into();
        failure.issues[0].hint = "Supply operations as an array of operation objects, or slide as one object, never both. Each operation needs op and its required node_id/path/value or node fields; never serialize nested objects into strings. Follow the EditSlide tool schema.".into();
        failure
    })?;
    let mut candidate = super::super::operations::apply(&before.slide, &edit).map_err(|error| {
        let mut failure = crate::presentation::schema::safety::diagnostic(
            &format!("invalid_edit: root {error}"), "/arguments");
        // Preserve stable operation error codes consumed by existing callers.
        failure.error = error;
        failure.message = "The edit could not be applied; nothing was submitted.".into();
        failure.issues[0].hint = "Use the supplied page's current node IDs and existing parent paths. Change fields only under /props/ or /layout/; use node operations for structural edits. Preserve page id and size.".into();
        failure
    })?;
    contract::normalize_retired_text_roles(&mut candidate);
    validate(before, &candidate)?;
    Ok(candidate)
}
