// Origin: app/backend/core/src/plugin_slide_markdown/tests.rs::every_supported_component_has_an_explicit_projection
use super::*;


#[test]
pub(super) fn every_supported_component_has_an_explicit_projection() {
    for kind in crate::presentation::schema::contract::component_types() {
        assert!(
            component_label(kind).is_some(),
            "missing projection: {kind}"
        );
    }
}
