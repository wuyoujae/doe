// Component contract from validate_component_props: "waterfall-chart"
use crate::schema::*;

pub(crate) fn validate_component_props_waterfall_chart(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            validate_object_items(props, path, "items", 1, 100, |item, item_path| {
                required_text(item, "label", item_path)?;
                number(
                    required(item, "value", item_path)?,
                    &format!("{item_path}.value"),
                )
            })
        }
}
