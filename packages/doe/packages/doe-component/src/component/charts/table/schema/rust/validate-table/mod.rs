// Origin: app/backend/core/src/slide_agent_output_contract.rs::validate_table
use crate::schema::*;


pub fn validate_table(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    let content = content_object(props, path)?;
    let content_path = format!("{path}.content");
    let columns = array(
        required(content, "columns", &content_path)?,
        &format!("{content_path}.columns"),
    )?;
    if columns.is_empty() || columns.len() > 12 {
        return mismatch(format!(
            "{content_path}.columns must contain 1 to 12 columns"
        ));
    }
    for (index, column) in columns.iter().enumerate() {
        let column_path = format!("{content_path}.columns[{index}]");
        let column = object(column, &column_path)?;
        if !column.contains_key("header") {
            return mismatch(format!("{column_path}.header is required"));
        }
    }
    let rows = array(
        required(content, "rows", &content_path)?,
        &format!("{content_path}.rows"),
    )?;
    for (index, row) in rows.iter().enumerate() {
        let row_path = format!("{content_path}.rows[{index}]");
        let row = object(row, &row_path)?;
        let cells = array(
            required(row, "cells", &row_path)?,
            &format!("{row_path}.cells"),
        )?;
        if cells.len() != columns.len() {
            return mismatch(format!("{row_path}.cells must match the column count"));
        }
    }
    Ok(())
}
