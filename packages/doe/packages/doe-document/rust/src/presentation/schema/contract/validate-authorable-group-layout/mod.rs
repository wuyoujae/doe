// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_group_layout
use super::*;


pub(super) fn validate_authorable_group_layout(value: &Value, path: &str) -> Result<(), String> {
    let layout = object(value, path)?;
    allowed_keys(
        layout,
        &[
            "variant",
            "direction",
            "ratio",
            "columns",
            "maxColumns",
            "align",
            "region",
            "mediaPosition",
            "mediaRatio",
            "mediaShape",
            "contentAlign",
        ],
        path,
    )?;
    validate_authorable_optional_enum(
        layout,
        "variant",
        path,
        &[
            "auto",
            "composition",
            "auto-grid",
            "grid",
            "columns",
            "row",
            "stack",
            "edge-media",
        ],
    )?;
    validate_authorable_optional_enum(layout, "direction", path, &["auto", "row", "stack"])?;
    validate_authorable_optional_enum(
        layout,
        "ratio",
        path,
        &["auto", "balanced", "primary-first", "primary-second"],
    )?;
    if let Some(columns) = layout.get("columns") {
        if columns.as_str().is_some() {
            validate_authorable_enum(columns, &format!("{path}.columns"), &["auto"])?;
        } else {
            validate_authorable_integer_range(columns, &format!("{path}.columns"), 1, 6)?;
        }
    }
    validate_authorable_optional_integer_range(layout, "maxColumns", path, 1, 6)?;
    validate_authorable_optional_enum(
        layout,
        "align",
        path,
        &["start", "center", "end", "stretch"],
    )?;
    validate_authorable_optional_enum(layout, "region", path, &["content", "media"])?;
    validate_authorable_optional_enum(
        layout,
        "mediaPosition",
        path,
        &["left", "right", "top", "bottom"],
    )?;
    validate_authorable_optional_number(layout, "mediaRatio", path)?;
    validate_authorable_optional_enum(
        layout,
        "mediaShape",
        path,
        &["straight", "fade", "diagonal", "circle", "inner-circle"],
    )?;
    validate_authorable_optional_enum(layout, "contentAlign", path, &["start", "center", "end"])?;
    if layout.get("variant").and_then(Value::as_str) == Some("edge-media") {
        if let Some(ratio) = layout.get("mediaRatio") {
            let ratio = finite_number(ratio, &format!("{path}.mediaRatio"))?;
            let vertical = matches!(
                layout.get("mediaPosition").and_then(Value::as_str),
                None | Some("left" | "right")
            );
            let range = if vertical { 0.28..=0.52 } else { 0.28..=0.58 };
            if !range.contains(&ratio) {
                return mismatch(format!("{path}.mediaRatio is outside the edge-media range"));
            }
        }
    }
    Ok(())
}
