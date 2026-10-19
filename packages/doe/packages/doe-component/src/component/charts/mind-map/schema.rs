use crate::schema::*;

pub(crate) fn mind_map_response() -> Value {
    required_props(json!({"content":required_props(json!({"items":{"type":"array","minItems":1,"maxItems":40,"items":required_props(json!({"level":{"type":"integer","minimum":0,"maximum":5},"title":text_response_schema(),"text":text_response_schema(),"icon":text_response_schema()}), &["level","title","text"])}}), &["items"])}), &["content"])
}
pub(crate) fn mind_map_shape(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["content"], path)?;
    let content = object(required(props,"content",path)?, &format!("{path}.content"))?;
    allowed_keys(content, &["items"], path)?;
    validate_authorable_object_items(content,"items",path,&["level","title","text","icon"])
}
pub fn mind_map_validate(props: &Map<String, Value>, path: &str) -> Result<(), String> {
    let content = object(required(props,"content",path)?, &format!("{path}.content"))?;
    let items = array(required(content,"items",path)?,path)?;
    if items.is_empty() || items.len() > 40 { return mismatch(format!("{path}: mind-map requires 1–40 nodes")); }
    let mut previous = 0; let mut branches = 0;
    for (i,value) in items.iter().enumerate() {
        let p = format!("{path}.content.items[{i}]"); let item = object(value,&p)?;
        let level = validate_authorable_integer_range(required(item,"level",&p)?,&p,0,5)?;
        if i == 0 && level != 0 || i > 0 && (level == 0 || level > previous + 1) { return mismatch(format!("{p}: invalid mind-map hierarchy")); }
        if level == 1 { branches += 1; }
        if branches > 6 { return mismatch(format!("{p}: root allows at most six branches")); }
        required_text(item,"title",&p)?; required_text(item,"text",&p)?;
        validate_authorable_optional_text(item,"icon",&p)?; previous = level;
    }
    Ok(())
}
