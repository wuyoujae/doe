// Origin: app/backend/core/src/presentation_shares.rs::strip_private
use super::*;


pub fn strip_private(value: &mut Value) {
    strip_private_fields(value, false);
    // A deck default that every page overrides is not a visible share asset.
    if value["deck"]["slides"].as_array().is_some_and(|slides| {
        !slides.is_empty() && slides.iter().all(|slide| slide.get("logo").is_some())
    }) {
        value.as_object_mut().unwrap().remove("logo");
    }
}
