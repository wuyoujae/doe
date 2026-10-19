// Component contract from validate_component_props: "risk-matrix"
use crate::schema::*;

pub(crate) fn validate_component_props_risk_matrix(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    validate_object_items(props, path, "items", 1, 100, |item, item_path| {
            required_text(item, "label", item_path)?;
            number(required(item, "x", item_path)?, &format!("{item_path}.x"))?;
            number(required(item, "y", item_path)?, &format!("{item_path}.y"))
        })
}
