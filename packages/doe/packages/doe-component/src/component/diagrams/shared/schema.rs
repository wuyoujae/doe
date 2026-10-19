use crate::schema::*;

fn bounds(kind: &str) -> (usize,usize) { match kind { "serpentine-process"=>(1,6), "recycling-arrows"|"wave-arrow"=>(3,3), "droplet-process"=>(1,5), "double-ring"=>(2,6), _=>(1,4) } }
fn icons(kind: &str) -> bool { matches!(kind,"concentric-circles"|"serpentine-process"|"icon-columns"|"badge-cards"|"folded-arrow"|"wave-arrow"|"layered-cube"|"double-ring"|"droplet-process"|"recycling-arrows") }

pub(crate) fn diagram_response(kind: &str) -> Value {
    let mut fields = json!({"title":text_response_schema(),"text":text_response_schema()});
    if icons(kind) { fields["icon"] = text_response_schema(); }
    if kind == "badge-cards" { fields["value"] = json!({"type":"string","maxLength":20_000}); }
    if kind == "vertical-progress" { fields.as_object_mut().unwrap().remove("title");fields["value"]=json!({"type":"number","minimum":0,"maximum":100}); }
    if kind == "double-ring" { fields["side"] = json!({"type":"string","enum":["left","right"]}); }
    let (min, max) = bounds(kind);
    let props = json!({"items":{"type":"array","minItems":min,"maxItems":max,"items":required_props(fields, if kind=="vertical-progress" {&["value","text"]} else {&["title","text"]})}});
    required_props(props, &["items"])
}
pub(crate) fn diagram_shape(kind: &str, props: &Map<String, Value>, path: &str) -> Result<(), String> {
    allowed_keys(props, &["items"], path)?;
    validate_authorable_object_items(props, "items", path, match kind {
        "badge-cards"=> &["title","text","icon","value"], "vertical-progress"=> &["value","text"], "double-ring" => &["title","text","side","icon"], _ if icons(kind) => &["title","text","icon"], _ => &["title","text"],
    })
}
pub(crate) fn diagram_validate(kind: &str, props: &Map<String, Value>, path: &str) -> Result<(), String> {
    let items_path = format!("{path}.items");
    let items = array(required(props,"items",path)?, &items_path)?;
    let (min,max)=bounds(kind);
    if !(min..=max).contains(&items.len()) {
        return mismatch(format!("{items_path}: {min}–{max} items required"));
    }
    let mut left = 0;
    for (i, value) in items.iter().enumerate() {
        let p = format!("{items_path}[{i}]");
        let item = object(value, &p)?;
        if kind=="vertical-progress" {
            let n=required(item,"value",&p)?.as_f64();
            if !n.is_some_and(|v|v.is_finite()&&(0.0..=100.0).contains(&v)) {return mismatch(format!("{p}.value must be a number from 0 to 100"));}
        } else {required_text(item,"title",&p)?;}
        required_text(item,"text",&p)?;
        if icons(kind) { validate_authorable_optional_text(item,"icon",&p)?; }
        if kind=="badge-cards" && item.get("value").and_then(Value::as_str)!=Some("") { validate_authorable_optional_text(item,"value",&p)?; }
        if kind == "double-ring" {
            validate_authorable_optional_enum(item,"side",&p,&["left","right"])?;
            if item.get("side").and_then(Value::as_str).unwrap_or(if i % 2 == 0 {"left"} else {"right"}) == "left" { left += 1; }
        }
    }
    if kind == "double-ring" && (!(1..=3).contains(&left) || !(1..=3).contains(&(items.len()-left))) {
        return mismatch(format!("{items_path}: each side requires 1–3 items"));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn extended_diagram_bounds_and_percentage() {
        for kind in ["serpentine-process","recycling-arrows","vertical-progress","icon-columns","badge-cards"] {
            let (min,max)=bounds(kind);
            for count in 0..=7 {
                let v=json!({"items":(0..count).map(|_|if kind=="vertical-progress" {json!({"value":65.5,"text":"说明"})} else {json!({"title":"阶段","text":"说明"})}).collect::<Vec<_>>()});
                assert_eq!(diagram_validate(kind,v.as_object().unwrap(),"props").is_ok(),(min..=max).contains(&count),"{kind}/{count}");
                if (min..=max).contains(&count) {diagram_shape(kind,v.as_object().unwrap(),"props").unwrap();}
            }
        }
        for value in [json!(-1),json!(101),json!("65%"),Value::Null] {
            let v=json!({"items":[{"value":value,"text":"说明"}]});assert!(diagram_validate("vertical-progress",v.as_object().unwrap(),"props").is_err());
        }
        let v=json!({"items":[{"title":"A","text":"B","icon":"Star","value":"10%"},{"title":"C","text":"D"}]});diagram_shape("badge-cards",v.as_object().unwrap(),"props").unwrap();diagram_validate("badge-cards",v.as_object().unwrap(),"props").unwrap();
        let mut empty=v.clone();empty["items"][0]["value"]=json!("");diagram_validate("badge-cards",empty.as_object().unwrap(),"props").unwrap();
    }
    #[test]
    fn diagram_collection_bounds_and_fields() {
        for kind in ["concentric-circles","layered-funnel","folded-arrow","wave-arrow","layered-cube","double-ring","droplet-process"] {
            for count in 0..=7 {
                let v = json!({"items":(0..count).map(|_|json!({"title":"阶段","text":"说明"})).collect::<Vec<_>>()});
                let expected = match kind { "wave-arrow"=>count==3, "double-ring"=>(2..=6).contains(&count), "droplet-process"=>(1..=5).contains(&count), _=>(1..=4).contains(&count) };
                assert_eq!(diagram_validate(kind,v.as_object().unwrap(),"props").is_ok(), expected,"{kind}/{count}");
            }
        }
        let bad=json!({"items":[{"title":"A","text":"B","side":"left"},{"title":"A","text":"B","side":"left"}]});
        assert!(diagram_validate("double-ring",bad.as_object().unwrap(),"props").is_err());
        assert!(diagram_shape("wave-arrow",bad.as_object().unwrap(),"props").is_err());
    }
}
