// Origin: app/backend/core/src/plugin_outline_validation.rs::object
use super::*;


pub fn object<'a>(
    v: &'a Value,
    path: &str,
    fields: &[&str],
    errors: &mut Failure,
) -> Option<&'a Map<String, Value>> {
    let Some(map) = v.as_object() else {
        errors.issue(
            path,
            "type",
            "Expected an object.",
            "Supply an object with the documented fields.",
        );
        return None;
    };
    for key in map.keys() {
        if !fields.contains(&key.as_str()) {
            // Unknown names are untrusted too; identify the parent without echoing arbitrary keys.
            errors.issue(
                path,
                "additional_property",
                "The object contains an unsupported field.",
                &format!("Allowed fields: {}.", fields.join(", ")),
            );
        }
    }
    for field in fields {
        if !map.contains_key(*field) {
            errors.issue(
                &format!("{path}/{field}"),
                "required",
                "A required field is missing.",
                "Supply this field using the documented type.",
            );
        }
    }
    Some(map)
}
