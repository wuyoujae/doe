use super::*;

fn literal(value: &Value) -> String {
    let text = value
        .as_str()
        .map(str::to_owned)
        .unwrap_or_else(|| value.to_string());
    if text.starts_with('\n')
        || text.ends_with('\n')
        || text.lines().any(|l| {
            l.strip_prefix('\\').is_some_and(|s| {
                heading(s).is_some() || attribute(s).is_some() || fence(s).is_some()
            })
        })
    {
        let mut longest = 0;
        let mut current = 0;
        for ch in text.chars() {
            if ch == '`' {
                current += 1;
                longest = longest.max(current)
            } else {
                current = 0
            }
        }
        let fence = "`".repeat(3.max(longest + 1));
        return format!("{fence}\n{text}\n{fence}");
    }
    text.lines()
        .map(|line| {
            if heading(line).is_some() || attribute(line).is_some() || fence(line).is_some() {
                format!("\\{line}")
            } else {
                line.into()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}
fn inline(value: &Value) -> bool {
    if let Some(items) = value.as_array() {
        items
            .iter()
            .all(|v| !v.is_object() && !v.is_array() && !v.as_str().unwrap_or("").contains('\n'))
    } else {
        !value.is_object() && !value.as_str().unwrap_or("").contains('\n')
    }
}
fn field(out: &mut Vec<String>, key: &str, value: &Value, s: &Value, level: usize) {
    if value.is_null() || s.get("default") == Some(value) {
        return;
    }
    if value.is_object() || value.is_array() {
        let encoded=if let Some(items)=value.as_array().filter(|a|a.iter().any(Value::is_object)) {
            let item_schema=s.get("item").or_else(||s["choices"].as_array()?.iter().find(|s|s["type"]=="array")?.get("item")).unwrap_or(&Value::Null);
            format!("<\n{}\n>",items.iter().map(|v|compact::value(v,item_schema)).collect::<Vec<_>>().join(",\n"))
        }else{compact::value(value,s)};
        out.push(format!("{key}={encoded}"));
    } else if value.as_str().unwrap_or("").contains('\n') {
        out.push(format!("\n{} {key}", "#".repeat(level)));
        out.push(literal(value));
    } else {
        out.push(format!(
            "{key}={}",
            value
                .as_str()
                .map(str::to_owned)
                .unwrap_or_else(|| value.to_string())
        ))
    }
}
fn object(out: &mut Vec<String>, value: &Value, s: &Value, level: usize) {
    let schema = if s["type"] == "union" {
        s["choices"]
            .as_array()
            .and_then(|a| a.iter().find(|s| s["type"] == "object"))
            .unwrap_or(s)
    } else {
        s
    };
    if let Some(entries) = value.as_object() {
        for flat in [true, false] {
            for (key, v) in entries {
                if let Some(s) = schema["fields"].get(key) {
                    if (inline(v) && !(v.is_array() && s["type"] == "union")) == flat {
                        field(out, key, v, s, level)
                    }
                }
            }
        }
    }
}
fn node(out: &mut Vec<String>, n: &Value, level: usize, include_layout: bool) -> Result<(), String> {
    if n["type"] == "layout-group" {
        let variant = n["layout"]["variant"]
            .as_str()
            .filter(|v| *v != "auto")
            .map(|v| format!("={v}"))
            .unwrap_or_default();
        let public = contract()["authoring"]["groups"].as_object().and_then(|groups|
            groups.iter().find(|(_, value)| value.as_str() == Some(n["layout"]["variant"].as_str().unwrap_or("auto"))).map(|(name, _)| name.as_str()));
        out.push(format!("\n{} {}", "#".repeat(level), public.map(str::to_owned).unwrap_or_else(|| format!("group{variant}"))));
        let mut layout = n["layout"].clone();
        if let Some(o) = layout.as_object_mut() {
            o.remove("variant");
            if !include_layout {
                for key in contract()["authoring"]["hostGroup"].as_array().unwrap() { o.remove(key.as_str().unwrap()); }
            }
        }
        object(out, &layout, &contract()["group"], level + 1);
        if let Some(children) = n["children"].as_array() {
            for c in children {
                node(out, c, level + 1, include_layout)?
            }
        }
        return Ok(());
    }
    let kind = n["type"].as_str().ok_or("doe_markdown_missing_type")?;
    let def = contract()["components"]
        .get(kind)
        .ok_or_else(|| format!("doe_markdown_unknown_component: {kind}"))?;
    let mut props = super::inline::author_props(n).as_object().cloned().unwrap_or_default();
    if props.get("itemLayout") == Some(&json!("auto")) {
        props.remove("itemColumns");
    } else if props.get("itemColumns").is_some_and(Value::is_number)
        && props.get("itemLayout")
            == Some(&json!(if props["itemColumns"] == 1 {
                "stack"
            } else {
                "grid"
            }))
    {
        props.remove("itemLayout");
    }
    if let Some(content) = props.remove("content").and_then(|v| v.as_object().cloned()) {
        props.extend(content)
    }
    if !include_layout {
        for key in contract()["authoring"]["hostProps"].as_array().unwrap() { props.remove(key.as_str().unwrap()); }
    }
    let mut fields = def["schema"]["fields"]
        .as_object()
        .cloned()
        .unwrap_or_default();
    if let Some(content) = fields.remove("content") {
        if let Some(f) = content["fields"].as_object() {
            fields.extend(f.clone())
        }
    }
    let short = def["shorthand"].as_str().unwrap_or("");
    let direct = if kind == "contents" {
        let value = props.get(short).unwrap_or(&fields[short]["default"]);
        contract()["authoring"]["presets"].as_object().and_then(|presets|
            presets.iter().find(|(_, preset)| &preset["presentation"] == value).map(|(name, _)| name.as_str()))
    } else { None };
    let suffix = props
        .remove(short)
        .filter(|v| fields[short].get("default") != Some(v))
        .map(|v| {
            let public = contract()["authoring"]["styles"][kind].as_object()
                .and_then(|styles| styles.iter().find(|(_, value)| *value == &v))
                .map(|(name, _)| name.clone());
            format!(
                "={}",
                public.unwrap_or_else(|| v.as_str()
                    .map(str::to_owned)
                    .unwrap_or_else(|| v.to_string()))
            )
        })
        .unwrap_or_default();
    let name = direct.or_else(|| contract()["authoring"]["names"][kind].as_str()).unwrap_or(kind);
    let suffix = if direct.is_some() { "" } else { &suffix };
    out.push(format!("\n{} {name}{suffix}", "#".repeat(level)));
    let body = def["body"].as_str().unwrap_or("");
    let body_value = props.remove(body);
    let complex = props.values().any(|v| !inline(v));
    if let Some(layout) = n["layout"].as_object() {
        props.extend(layout.clone())
    }
    fields.extend(
        contract()["leafLayout"]["fields"]
            .as_object()
            .unwrap()
            .clone(),
    );
    object(
        out,
        &Value::Object(props),
        &json!({"type":"object","fields":fields}),
        level + 1,
    );
    if let Some(value) = body_value {
        if complex {
            out.push(format!("\n{} {body}", "#".repeat(level + 1)))
        }
        out.push(literal(&value))
    }
    Ok(())
}
pub fn serialize(input: &Value) -> Result<String, String> {
    serialize_document(input, false)
}
/// Compatibility projection for independent renderer comparisons; never an AI prompt.
pub fn serialize_with_layout_overrides(input: &Value) -> Result<String, String> {
    serialize_document(input, true)
}
fn serialize_document(input: &Value, include_layout: bool) -> Result<String, String> {
    let source = input.get("deck").unwrap_or(input);
    let mut out = Vec::new();
    if let Some(logo) = input.get("logo") {
        field(&mut out, "logo", &json!(logo["src"].as_str().unwrap_or("none")), &contract()["deck"]["fields"]["logo"], 1);
    }
    if input["pageNumber"]["enabled"] == false {
        out.push("pageNumber=false".into())
    }
    if input["pageNumber"]["format"] == "fraction" {
        out.push("pageNumberFormat=fraction".into())
    }
    if let Some(theme) = source.get("theme") {
        field(&mut out, "theme", theme, &contract()["deck"]["fields"]["theme"], 1);
    }
    if let Some(title) = source.get("title") {
        field(&mut out, "title", title, &contract()["deck"]["fields"]["title"], 1);
    }
    let slides = source["slides"]
        .as_array()
        .cloned()
        .unwrap_or_else(|| vec![input.get("slide").unwrap_or(input).clone()]);
    for slide in slides {
        out.push("\n# slide".into());
        if let Some(logo) = slide.get("logo") {
            field(&mut out, "logo", &json!(logo["src"].as_str().unwrap_or("none")), &contract()["slide"]["fields"]["logo"], 2);
        }
        if let Some(preset) = slide["layout"]["preset"].as_str().filter(|p| *p != "flow") {
            out.push(format!("preset={preset}"))
        }
        if let Some(bg) = slide.get("background") {
            field(
                &mut out,
                "background",
                bg,
                &contract()["slide"]["fields"]["background"],
                2,
            )
        }
        if let Some(blocks) = slide["blocks"].as_array() {
            for b in blocks {
                node(&mut out, b, 2, include_layout)?
            }
        }
    }
    Ok(format!("{}\n", out.join("\n").trim()))
}
