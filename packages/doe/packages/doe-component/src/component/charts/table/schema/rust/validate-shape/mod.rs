// Component contract from validate_authorable_component_shape: "table"
use crate::schema::*;

pub(crate) fn validate_authorable_component_shape_table(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let content = authorable_content(
                props,
                path,
                &[
                    "content",
                    "ariaLabel",
                    "borderStyle",
                    "columnSizing",
                    "semanticWrap",
                ],
                &["columns", "rows"],
            )?;
            let content_path = format!("{path}.content");
            validate_authorable_object_items(
                content,
                "columns",
                &content_path,
                &["header", "align", "locale", "protectedTerms"],
            )?;
            for (index, row) in content["rows"]
                .as_array()
                .expect("validated Table rows")
                .iter()
                .enumerate()
            {
                let row_path = format!("{content_path}.rows[{index}]");
                let row = object(row, &row_path)?;
                allowed_keys(row, &["cells"], &row_path)?;
                for (cell_index, cell) in row["cells"]
                    .as_array()
                    .expect("validated Table cells")
                    .iter()
                    .enumerate()
                {
                    if cell.is_object() {
                        let cell_path = format!("{row_path}.cells[{cell_index}]");
                        allowed_keys(object(cell, &cell_path)?, &["text", "emphasis"], &cell_path)?;
                    }
                }
            }
            if props.get("semanticWrap").is_some_and(Value::is_object) {
                validate_authorable_optional_object(
                    props,
                    "semanticWrap",
                    path,
                    &["locale", "protectedTerms"],
                )?;
            }
            Ok(())
        }
}
