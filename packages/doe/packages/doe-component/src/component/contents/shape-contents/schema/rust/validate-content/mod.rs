// Component contract from validate_component_props: "shape-contents"
use crate::schema::*;

pub(crate) fn validate_component_props_shape_contents(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    {
            let items_path = format!("{path}.items");
            let items = array(required(props, "items", path)?, &items_path)?;
            let variant = props.get("variant").and_then(Value::as_str).unwrap_or("semicircle");
            let max = match variant { "semicircle" | "cycle-arrows" | "full-circle" | "ring" => 6, "petals" => 8, _ => 12 };
            if !(2..=max).contains(&items.len()) {
                return mismatch(format!("{items_path} requires 2 to 6 semicircle/cycle-arrow/full-circle/ring, 2 to 8 petal, or 2 to 12 stair/pyramid items"));
            }
            for (index, value) in items.iter().enumerate() {
                let item_path = format!("{items_path}[{index}]");
                let item = object(value, &item_path)?;
                required_text(item, "title", &item_path)?;
                required_text(item, "text", &item_path)?;
                validate_authorable_optional_text(item, "icon", &item_path)?;
            }
            Ok(())
        }
}
