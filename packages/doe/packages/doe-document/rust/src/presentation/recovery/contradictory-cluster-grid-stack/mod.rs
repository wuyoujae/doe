// Origin: app/backend/core/src/slide_recovery/mod.rs::contradictory_cluster_grid_stack
use super::*;


pub(super) fn contradictory_cluster_grid_stack(node: &Value) -> bool {
    node.get("type").and_then(Value::as_str) == Some("layout-group")
        && (node.get("kind").and_then(Value::as_str) == Some("cluster")
            || node
                .get("layout")
                .and_then(|value| value.get("cluster"))
                .and_then(Value::as_bool)
                == Some(true))
        && node
            .get("layout")
            .and_then(|value| value.get("variant"))
            .and_then(Value::as_str)
            == Some("auto-grid")
        && node
            .get("layout")
            .and_then(|value| value.get("direction"))
            .and_then(Value::as_str)
            == Some("stack")
        && node
            .get("layout")
            .and_then(|value| value.get("lock"))
            .and_then(Value::as_str)
            != Some("structure")
}
