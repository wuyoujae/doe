// Origin: app/backend/core/src/slide_recovery/mod.rs::leaf_props_satisfy_contract
use super::*;


pub(super) fn leaf_props_satisfy_contract(component_type: &str, props: &Map<String, Value>) -> bool {
    slide_agent_output_contract::validate_slide_value(
        &json!({
            "id": "contract-probe-slide",
            "size": {"width": 960, "height": 540, "unit": "pt"},
            "blocks": [{
                "id": "contract-probe-node",
                "type": component_type,
                "props": props
            }]
        }),
        0,
    )
    .is_ok()
}
