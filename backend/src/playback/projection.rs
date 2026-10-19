// Original DOE playback projection and command validation, baseline 98cbdd57.
use super::valid_link;
use serde_json::{Value, json};
fn strip_notes(value: &mut Value) {
    match value {
        Value::Object(map) => {
            map.retain(|key, _| {
                !matches!(
                    key.to_ascii_lowercase().as_str(),
                    "notes" | "speakernotes" | "presenternotes"
                )
            });
            for v in map.values_mut() {
                strip_notes(v);
            }
        }
        Value::Array(a) => {
            for v in a {
                strip_notes(v);
            }
        }
        _ => {}
    }
}
fn target_exists(blocks: &Value, id: &str) -> bool {
    blocks.as_array().is_some_and(|blocks| {
        blocks
            .iter()
            .any(|b| b["id"].as_str() == Some(id) || target_exists(&b["children"], id))
    })
}
pub fn make_show(deck: &Value, motions: &Value) -> Result<(Value, Value), String> {
    let mut slides = deck["deck"]["slides"]
        .as_array()
        .filter(|s| !s.is_empty() && s.len() <= 100)
        .ok_or("playback_invalid")?
        .clone();
    let mut motion = Vec::new();
    let mut notes = Vec::new();
    for slide in &mut slides {
        let id = slide["id"].as_str().ok_or("playback_invalid")?;
        let m = motions
            .get(id)
            .or_else(|| slide.get("presentation"))
            .unwrap_or(&Value::Null);
        let text = m["notes"]
            .as_str()
            .or_else(|| slide["notes"].as_str())
            .unwrap_or("");
        if text.len() > 60000 {
            return Err("playback_invalid".into());
        }
        notes.push(text.to_owned());
        let cues = m["cues"].as_array().cloned().unwrap_or_default();
        if cues.len() > 200 {
            return Err("playback_invalid".into());
        }
        let mut clean = Vec::new();
        let mut cue_ids = std::collections::HashSet::new();
        for c in cues {
            if !matches!(
                c["effect"].as_str(),
                Some("fade" | "rise" | "zoom" | "pulse" | "exit")
            ) || !matches!(c["trigger"].as_str(), Some("click" | "with" | "after"))
                || !c["duration"]
                    .as_f64()
                    .is_some_and(|n| (80.0..=10000.0).contains(&n))
                || !c["delay"]
                    .as_f64()
                    .is_some_and(|n| (0.0..=30000.0).contains(&n))
                || c["target"].as_str().map_or(true, |s| s.len() > 128)
                || c["id"]
                    .as_str()
                    .map_or(true, |s| s.is_empty() || s.len() > 128)
                || !cue_ids.insert(c["id"].as_str().unwrap_or("").to_owned())
                || !target_exists(&slide["blocks"], c["target"].as_str().unwrap_or(""))
            {
                return Err("playback_invalid".into());
            }
            clean.push(json!({"id":c["id"],"target":c["target"],"effect":c["effect"],"trigger":c["trigger"],"duration":c["duration"],"delay":c["delay"]}));
        }
        let transition = m["transition"]
            .as_str()
            .filter(|v| matches!(*v, "none" | "fade" | "push"))
            .unwrap_or("fade");
        motion.push(json!({"cues":clean,"transition":transition}));
        strip_notes(slide);
        slide["editor"] = json!(false);
    }
    Ok((
        json!({"slides":slides,"theme":deck["deck"]["theme"],"pageNumber":deck["pageNumber"],"logo":deck["logo"],"motion":motion}),
        json!(notes),
    ))
}
pub fn validate_command(c: &Value) -> Result<(), String> {
    if c.to_string().len() > 16384
        || !c["epoch"].as_str().is_some_and(valid_link)
        || !c["commandId"].as_str().is_some_and(valid_link)
        || !c["clientId"].as_str().is_some_and(valid_link)
        || c["revision"].as_u64().is_none()
    {
        return Err("playback_invalid".into());
    }
    match c["action"].as_str() {
        Some("next" | "previous" | "black" | "end" | "clear") => {}
        Some("erase") => {
            if !c["strokeId"].as_str().is_some_and(valid_link) {
                return Err("playback_invalid".into());
            }
        }
        Some("laser") => {
            if !point(&c["point"]) && !c["point"].is_null() {
                return Err("playback_invalid".into());
            }
        }
        Some("ink") => {
            let s = &c["stroke"];
            if !s["id"].as_str().is_some_and(valid_link)
                || !matches!(
                    s["color"].as_str(),
                    Some("#ef4444" | "#facc15" | "#22c55e" | "#38bdf8" | "#ffffff")
                )
                || !matches!(s["tool"].as_str(), Some("pen" | "highlighter"))
                || !matches!(s["width"].as_u64(), Some(3 | 6 | 12))
                || !s["points"]
                    .as_array()
                    .is_some_and(|p| !p.is_empty() && p.len() <= 512 && p.iter().all(point))
            {
                return Err("playback_invalid".into());
            }
        }
        _ => return Err("playback_invalid".into()),
    }
    Ok(())
}
fn point(v: &Value) -> bool {
    v.as_array().is_some_and(|p| {
        p.len() == 2
            && p.iter()
                .all(|v| v.as_f64().is_some_and(|n| (0.0..=1.0).contains(&n)))
    })
}
