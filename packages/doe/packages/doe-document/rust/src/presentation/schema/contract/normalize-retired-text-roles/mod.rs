use serde_json::Value;

/// Ignore the retired text-only presentation hint at document boundaries.
pub fn normalize_retired_text_roles(value: &mut Value) {
    let mut pending = vec![value];
    while let Some(value) = pending.pop() {
        match value {
            Value::Array(items) => pending.extend(items.iter_mut()),
            Value::Object(object) => {
                if object.get("type").and_then(Value::as_str) == Some("text") {
                    if let Some(props) = object.get_mut("props").and_then(Value::as_object_mut) {
                        props.remove("textRole");
                    }
                }
                for (key, child) in object.iter_mut() {
                    if matches!(key.as_str(), "deck" | "slide" | "slides" | "blocks" | "children") {
                        pending.push(child);
                    }
                }
            }
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn removes_only_retired_node_properties_and_is_idempotent() {
        let mut value = json!({"deck":{"slides":[{"blocks":[{
            "type":"layout-group","children":[
                {"type":"text","props":{"text":"textRole: describe\n完整正文","textRole":null}},
                {"type":"table","props":{"textRole":"business-data","content":{"textRole":"keep"}}}
            ]
        }]}]}});
        normalize_retired_text_roles(&mut value);
        let children = &value["deck"]["slides"][0]["blocks"][0]["children"];
        assert_eq!(children[0]["props"], json!({"text":"textRole: describe\n完整正文"}));
        assert_eq!(children[1]["props"]["textRole"], "business-data");
        assert_eq!(children[1]["props"]["content"]["textRole"], "keep");
        let normalized = value.clone();
        normalize_retired_text_roles(&mut value);
        assert_eq!(value, normalized);
    }
}
