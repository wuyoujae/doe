// Origin: app/backend/core/src/slide_recovery/mod.rs::collect_node_relation_diagnostics
use super::*;


pub(super) fn collect_node_relation_diagnostics(
    node: &Value,
    path: &str,
    page_index: usize,
    node_ids: &mut HashMap<String, Vec<String>>,
    diagnostics: &mut Vec<SlideDiagnostic>,
) {
    let Some(object) = node.as_object() else {
        return;
    };
    if let Some(node_id) = object.get("id").and_then(Value::as_str) {
        node_ids
            .entry(node_id.to_string())
            .or_default()
            .push(path.to_string());
    }
    if object.get("type").and_then(Value::as_str) == Some("layout-group") {
        if let Some(children) = object.get("children").and_then(Value::as_array) {
            for (child_index, child) in children.iter().enumerate() {
                collect_node_relation_diagnostics(
                    child,
                    &format!("{path}.children[{child_index}]"),
                    page_index,
                    node_ids,
                    diagnostics,
                );
            }
        }
        return;
    }
    let Some(component_type) = object.get("type").and_then(Value::as_str) else {
        return;
    };
    let Some(props) = object.get("props").and_then(Value::as_object) else {
        return;
    };
    let content = props.get("content").and_then(Value::as_object);
    match component_type {
        "table" => {
            let columns = content
                .and_then(|value| value.get("columns"))
                .and_then(Value::as_array);
            let rows = content
                .and_then(|value| value.get("rows"))
                .and_then(Value::as_array);
            if let (Some(columns), Some(rows)) = (columns, rows) {
                for (row_index, row) in rows.iter().enumerate() {
                    if row
                        .get("cells")
                        .and_then(Value::as_array)
                        .is_some_and(|cells| cells.len() != columns.len())
                    {
                        push_relation_diagnostic(
                            diagnostics,
                            "component.table_cell_count_mismatch",
                            &format!("{path}.props.content.rows[{row_index}].cells"),
                            "table row cell count does not match column count",
                            page_index,
                        );
                    }
                }
            }
        }
        "grouped-bar-chart" | "line-chart" | "stacked-bar-chart" => {
            let categories = content
                .and_then(|value| value.get("categories"))
                .and_then(Value::as_array);
            let series = content
                .and_then(|value| value.get("series"))
                .and_then(Value::as_array);
            if let (Some(categories), Some(series)) = (categories, series) {
                for (series_index, item) in series.iter().enumerate() {
                    if item
                        .get("data")
                        .and_then(Value::as_array)
                        .is_some_and(|data| data.len() != categories.len())
                    {
                        push_relation_diagnostic(
                            diagnostics,
                            "component.series_length_mismatch",
                            &format!("{path}.props.content.series[{series_index}].data"),
                            "chart data length does not match category count",
                            page_index,
                        );
                    }
                }
            }
        }
        "radar-chart" => {
            let axes = content
                .and_then(|value| value.get("axes"))
                .and_then(Value::as_array);
            let datasets = content
                .and_then(|value| value.get("datasets"))
                .and_then(Value::as_array);
            if let (Some(axes), Some(datasets)) = (axes, datasets) {
                for (dataset_index, item) in datasets.iter().enumerate() {
                    if item
                        .get("values")
                        .and_then(Value::as_array)
                        .is_some_and(|values| values.len() != axes.len())
                    {
                        push_relation_diagnostic(
                            diagnostics,
                            "component.radar_length_mismatch",
                            &format!("{path}.props.content.datasets[{dataset_index}].values"),
                            "radar value count does not match axis count",
                            page_index,
                        );
                    }
                }
            }
        }
        _ => {}
    }
}
