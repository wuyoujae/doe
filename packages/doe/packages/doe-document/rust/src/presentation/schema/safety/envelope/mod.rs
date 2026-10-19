// Origin: app/backend/core/src/plugin_slide_validation.rs::envelope
use super::*;


pub fn envelope(slide: Value) -> Value {
    json!({"version":4,"pageNumber":{"enabled":true,"format":"number"},"deck":{"title":"Slide validation","theme":"yrkie-theme","slides":[slide]}})
}
