// Origin: app/backend/core/src/plugin_outline_validation/tests.rs::sample
use super::*;


pub(super) fn sample() -> Value {
    json!({"title":"有效的大纲","page_count":1,"body":[{"index":1,"page":1,"contents":["Revenue < 5; O'Brien; SELECT is a word. Data: 42 units. File: budget report. If x < y then y > x.","Line one\nLine two"]}]})
}
