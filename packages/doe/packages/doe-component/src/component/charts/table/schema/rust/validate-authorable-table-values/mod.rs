// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_authorable_table_values
use crate::schema::*;


pub fn validate_authorable_table_values(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_authorable_optional_text(props, "ariaLabel", path)?;
    validate_authorable_optional_enum(props, "borderStyle", path, &["grid", "none", "three-line"])?;
    validate_authorable_optional_enum(props, "columnSizing", path, &["auto", "equal", "adaptive"])?;
    if let Some(semantic_wrap) = props.get("semanticWrap") {
        if semantic_wrap != &Value::Bool(false) {
            let semantic_path = format!("{path}.semanticWrap");
            let semantic_wrap = object(semantic_wrap, &semantic_path)?;
            validate_authorable_optional_text(semantic_wrap, "locale", &semantic_path)?;
            validate_authorable_optional_string_array(
                semantic_wrap,
                "protectedTerms",
                &semantic_path,
            )?;
        }
    }

    let content = content_object(props, path)?;
    let content_path = format!("{path}.content");
    for (index, column) in content["columns"]
        .as_array()
        .expect("validated Table columns")
        .iter()
        .enumerate()
    {
        let column_path = format!("{content_path}.columns[{index}]");
        let column = object(column, &column_path)?;
        required_text(column, "header", &column_path)?;
        validate_authorable_optional_enum(
            column,
            "align",
            &column_path,
            &["left", "center", "right"],
        )?;
        validate_authorable_optional_text(column, "locale", &column_path)?;
        validate_authorable_optional_string_array(column, "protectedTerms", &column_path)?;
    }
    let rows = content["rows"].as_array().expect("validated Table rows");
    if rows.is_empty() || rows.len() > 100 {
        return mismatch(format!(
            "{content_path}.rows must contain between 1 and 100 items"
        ));
    }
    for (row_index, row) in rows.iter().enumerate() {
        let row_path = format!("{content_path}.rows[{row_index}]");
        for (cell_index, cell) in row["cells"]
            .as_array()
            .expect("validated Table cells")
            .iter()
            .enumerate()
        {
            let cell_path = format!("{row_path}.cells[{cell_index}]");
            if cell.is_string() {
                nonempty_text(cell, &cell_path)?;
            } else if cell.is_number() {
                finite_number(cell, &cell_path)?;
            } else {
                let cell = object(cell, &cell_path)?;
                required_text(cell, "text", &cell_path)?;
                validate_authorable_optional_enum(
                    cell,
                    "emphasis",
                    &cell_path,
                    &["muted", "highlight"],
                )?;
            }
        }
    }
    Ok(())
}
