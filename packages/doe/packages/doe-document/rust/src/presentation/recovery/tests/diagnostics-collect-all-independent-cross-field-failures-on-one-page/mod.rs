// Origin: app/backend/core/src/slide_recovery/tests.rs::diagnostics_collect_all_independent_cross_field_failures_on_one_page
use super::*;


#[test]
pub(super) fn diagnostics_collect_all_independent_cross_field_failures_on_one_page() {
    let slide = json!({
        "id": "slide-1",
        "size": {"width": 960, "height": 540, "unit": "pt"},
        "blocks": [
            {
                "id": "duplicate-node",
                "type": "table",
                "props": {"content": {
                    "columns": [{"header": "A"}, {"header": "B"}],
                    "rows": [{"cells": ["only one"]}]
                }}
            },
            {
                "id": "duplicate-node",
                "type": "line-chart",
                "props": {"content": {
                    "categories": ["Q1", "Q2"],
                    "series": [{"name": "Revenue", "data": [1]}]
                }}
            },
            {
                "id": "radar",
                "type": "radar-chart",
                "props": {"content": {
                    "axes": ["A", "B", "C"],
                    "datasets": [{"name": "Now", "values": [1, 2]}]
                }}
            }
        ]
    });
    let plan = plan_page_repairs(&deck(vec![slide]).to_string(), expectations(1), &[]).unwrap();
    let codes = plan.targets[0]
        .diagnostics
        .iter()
        .map(|finding| finding.code.as_str())
        .collect::<HashSet<_>>();
    assert!(codes.contains("node.id_duplicate"));
    assert!(codes.contains("component.table_cell_count_mismatch"));
    assert!(codes.contains("component.series_length_mismatch"));
    assert!(codes.contains("component.radar_length_mismatch"));
}
