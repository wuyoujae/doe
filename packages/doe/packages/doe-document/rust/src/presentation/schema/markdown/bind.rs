use super::*;
use std::collections::{HashMap, HashSet};

fn signature(node: &Value) -> Option<String> {
    let source = json!({"blocks":[node]});
    let compiled = compile(&serialize(&source).ok()?, &[]).ok()?;
    Some(crate::presentation::repair::canonical_value_sha256(
        &compiled.value,
    ))
}
fn bind_nodes(old: &[Value], new: &mut [Value]) {
    let mut by_signature: HashMap<String, Vec<usize>> = HashMap::new();
    for (i, node) in old.iter().enumerate() {
        if let Some(s) = signature(node) {
            by_signature.entry(s).or_default().push(i)
        }
    }
    let mut used = HashSet::new();
    for (i, node) in new.iter_mut().enumerate() {
        let exact = signature(node)
            .and_then(|s| by_signature.get(&s))
            .and_then(|ids| ids.iter().find(|i| !used.contains(*i) && manual_compatible(&old[**i], node)))
            .copied();
        if let Some(index) = exact {
            used.insert(index);
            *node = old[index].clone();
            continue;
        }
        if let Some(previous) = old
            .get(i)
            .filter(|p| p["type"] == node["type"] && !used.contains(&i))
        {
            used.insert(i);
            node["id"] = previous["id"].clone();
            if let Some(layout) = previous["layout"].as_object() {
                let mut retained = layout.clone();
                if let Some(next) = node["layout"].as_object() { retained.extend(next.clone()); }
                node["layout"] = Value::Object(retained);
            }
            for (key, value) in previous.as_object().unwrap() {
                if !matches!(key.as_str(), "id" | "type" | "props" | "layout" | "children" | "textOverrides") { node[key] = value.clone(); }
            }
            if let Some(entries) = previous["textOverrides"].as_array() {
                let valid: Vec<_> = entries.iter().filter(|entry| {
                    let Some(path) = entry["path"].as_array() else { return false; };
                    let mut value = &node["props"];
                    for key in path {
                        value = if let Some(k) = key.as_str() { value.get(k) } else { key.as_u64().and_then(|k| value.get(k as usize)) }.unwrap_or(&Value::Null);
                    }
                    if let Some(parts) = value.as_array() { json!(parts.iter().filter_map(Value::as_str).collect::<Vec<_>>().join("\n")) == entry["text"] }
                    else { value == &entry["text"] }
                }).cloned().collect();
                let mut authored = node["textOverrides"].as_array().cloned().unwrap_or_default();
                for entry in valid { if !authored.iter().any(|next|next["path"]==entry["path"]) { authored.push(entry); } }
                if !authored.is_empty() { node["textOverrides"] = json!(authored); }
            }
            // Omitted authoring controls do not reset a user's manual Canvas layout.
            for key in contract()["authoring"]["hostProps"].as_array().unwrap() {
                let key = key.as_str().unwrap();
                if let Some(value) = previous["props"].get(key) {
                    if node["props"].get(key).is_none_or(|v| v == "auto") {
                        node["props"][key] = value.clone();
                    }
                }
            }
            for key in contract()["authoring"]["hostGroup"].as_array().unwrap() {
                let key = key.as_str().unwrap();
                if let Some(value) = previous["layout"].get(key) {
                    if node["layout"].get(key).is_none() { node["layout"][key] = value.clone(); }
                }
            }
            if let (Some(old_children), Some(new_children)) = (
                previous["children"].as_array(),
                node.get_mut("children").and_then(Value::as_array_mut),
            ) {
                bind_nodes(old_children, new_children)
            }
        }
    }
    // Generated node IDs must never collide with retained identities after insert/reorder.
    let mut ids = HashSet::new();
    for node in new.iter_mut() {
        let base = node["id"].as_str().unwrap_or("node").to_owned();
        let mut id = base.clone();
        let mut n = 1;
        while !ids.insert(id.clone()) {
            id = format!("{base}-new-{n}");
            n += 1
        }
        node["id"] = json!(id);
    }
}
fn manual_compatible(old: &Value, node: &Value) -> bool {
    [("hostProps", "props"), ("hostGroup", "layout")].iter().all(|(list, field)| {
        contract()["authoring"][list].as_array().unwrap().iter().all(|key| {
            let key = key.as_str().unwrap();
            node[field].get(key).is_none_or(|v| v == "auto" || Some(v) == old[field].get(key))
        })
    })
}
pub fn compile_bound_slide(raw: &str, original: &Value) -> Result<Value, String> {
    let id = original["id"]
        .as_str()
        .ok_or("doe_markdown_bound_slide_missing")?;
    fn collect_ids(node: &Value, ids: &mut Vec<String>) {
        if let Some(id) = node["id"].as_str() {
            ids.push(id.into())
        }
        if let Some(children) = node["blocks"]
            .as_array()
            .or_else(|| node["children"].as_array())
        {
            for c in children {
                collect_ids(c, ids)
            }
        }
    }
    let mut old_ids = Vec::new();
    collect_ids(original, &mut old_ids);
    let mut n = 1;
    let namespace = loop {
        let prefix = format!("{id}-new-{n}");
        if !old_ids.iter().any(|i| i.starts_with(&prefix)) {
            break prefix;
        }
        n += 1;
    };
    let compiled = compile(raw, &[namespace])?;
    let slides = compiled.value["deck"]["slides"].as_array().unwrap();
    if slides.len() != 1 {
        return Err("doe_markdown_edit_requires_one_slide".into());
    }
    let mut candidate = slides[0].clone();
    if let Some(layout) = original["layout"].as_object() {
        let mut retained = layout.clone();
        retained.insert("preset".into(), json!("flow"));
        if let Some(next) = candidate["layout"].as_object() { retained.extend(next.clone()); }
        candidate["layout"] = Value::Object(retained);
    }
    if let (Some(old), Some(new)) = (
        original["blocks"].as_array(),
        candidate["blocks"].as_array_mut(),
    ) {
        bind_nodes(old, new)
    }
    // Page identity and non-authoring state are host-owned, including motion and editor settings.
    if let Some(fields) = original.as_object() {
        for (key, value) in fields {
            if !matches!(key.as_str(), "blocks" | "layout" | "background") && !(key == "logo" && candidate.get("logo").is_some()) {
                candidate[key] = value.clone()
            }
        }
    }
    Ok(candidate)
}
