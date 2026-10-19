// Origin: app/backend/core/src/plugin_slide_validation.rs::edit_safety
use super::*;


pub fn edit_safety(value: &Value) -> Result<(), Failure> {
    let mut errors = Failure::from("validation_failed");
    safety(value, "", "", &mut errors, &mut 0);
    errors.finish()
}
