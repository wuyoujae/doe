// Origin: app/backend/core/src/doe_slide_edit/tests.rs::page
use super::*;


pub(super) fn page() -> Value {
    json!({"id":"s1","size":{"width":960,"height":540,"unit":"pt"},"blocks":[
        {"id":"g1","type":"layout-group","layout":{"direction":"vertical"},"children":[
            {"id":"n1","type":"text","props":{"text":"Original"}},
            {"id":"n2","type":"text","props":{"text":"Untouched"}}
        ]}
    ]})
}
