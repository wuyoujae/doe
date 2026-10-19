// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_slide_value
use super::*;


pub fn validate_slide_value(value: &Value, index: usize) -> Result<(), String> {
    let mut value = value.clone();
    if let Some(slide) = value.as_object_mut() {
        slide.remove("theme");
    }
    let mut slide_ids = HashSet::new();
    validate_slide(&value, index, &mut slide_ids)
}
