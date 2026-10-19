// Origin: app/backend/core/src/slide_agent_output_contract/validation.rs::validate_slide
use super::*;


pub fn validate_slide(slide: &Value) -> Result<(), Failure> {
    validate(slide).map_err(|error| {
        let mut failure = crate::presentation::schema::safety::diagnostic(&error, "/slide");
        failure.error = "doe_slide_validation_failed".into();
        failure.message = "The slide is invalid. Correct the reported field before submitting again.".into();
        for issue in &mut failure.issues {
            issue.hint = "Use real JSON objects/arrays for containers, follow the component Schema and preserve valid runtime fields. No automatic repair is performed.".into();
        }
        failure
    })
}
