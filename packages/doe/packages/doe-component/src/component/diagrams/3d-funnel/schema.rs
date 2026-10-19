use crate::schema::*;

pub(crate) fn funnel_3d_response() -> Value {
    required_props(json!({"items":{"type":"array","minItems":1,"maxItems":4,
        "items":required_props(json!({"title":text_response_schema(),"text":text_response_schema()}), &["title","text"])}}), &["items"])
}

pub(crate) fn funnel_3d_shape(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["items"], path)?;
    validate_authorable_object_items(props, "items", path, &["title", "text"])
}

pub(crate) fn funnel_3d_validate(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    let items_path = format!("{path}.items");
    let items = array(required(props, "items", path)?, &items_path)?;
    if !(1..=4).contains(&items.len()) { return mismatch(format!("{items_path} requires 1 to 4 items")); }
    for (index, value) in items.iter().enumerate() {
        let item_path = format!("{items_path}[{index}]");
        let item = object(value, &item_path)?;
        required_text(item, "title", &item_path)?;
        required_text(item, "text", &item_path)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn funnel_requires_one_to_four_complete_items() {
        for count in 0..=7 {
            let props = json!({"items":(0..count).map(|_|json!({"title":"阶段","text":"内容"})).collect::<Vec<_>>()});
            assert_eq!(funnel_3d_validate(props.as_object().unwrap(), "props").is_ok(), (1..=4).contains(&count));
            assert!(funnel_3d_shape(props.as_object().unwrap(), "props").is_ok());
        }
        for props in [json!({"title":"不可见标题","items":[]}), json!({"items":[{"title":"阶段","text":"内容","icon":"Target"}]})] {
            assert!(funnel_3d_shape(props.as_object().unwrap(), "props").is_err());
        }
        assert!(funnel_3d_validate(json!({"items":[{"title":"A"},{"title":"B","text":"内容"}]}).as_object().unwrap(), "props").is_err());
    }
}
