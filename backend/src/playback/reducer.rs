//! Equivalent local reducer for presentation_playback.lua at 98cbdd57.
use super::*;
use serde_json::json;
use sha2::{Digest, Sha256};

impl Service {
    pub fn command(&self, link: &str, token: Option<&str>, command: Value) -> Result<Value> {
        projection::validate_command(&command).map_err(|_| Error("playback_invalid"))?;
        let mut lives = self.lives.lock().map_err(unavailable)?;
        let db = crate::db::connect(&self.path)?;
        let grant = self.grant(&db, link, token)?;
        let live = lives
            .get_mut(&grant.key)
            .filter(|v| v.expires > now())
            .ok_or(Error("playback_ended"))?;
        if command["epoch"] != live.state["epoch"] {
            return Err(Error("playback_conflict"));
        }
        let id = command["commandId"]
            .as_str()
            .ok_or(Error("playback_invalid"))?;
        let digest = format!("{:x}", Sha256::digest(serde_json::to_vec(&command)?));
        if let Some((_, before)) = live.commands.iter().find(|(saved, _)| saved == id) {
            return if *before == digest {
                Ok(json!({"ok":true}))
            } else {
                Err(Error("playback_conflict"))
            };
        }
        let time = now();
        while live
            .rate
            .front()
            .is_some_and(|v| time.saturating_sub(*v) >= 1000)
        {
            live.rate.pop_front();
        }
        if live.rate.len() >= 120 {
            return Err(Error("playback_rate_limited"));
        }
        live.rate.push_back(time);
        if command["revision"] != live.state["revision"] {
            return Err(Error("playback_conflict"));
        }
        let action = command["action"]
            .as_str()
            .ok_or(Error("playback_invalid"))?;
        let ink = matches!(action, "ink" | "erase" | "clear" | "laser");
        let mut state = live.state.clone();
        let mut index = state["index"].as_u64().ok_or(Error("playback_invalid"))? as usize;
        let mut step = state["step"].as_u64().ok_or(Error("playback_invalid"))?;
        let page = index.to_string();
        let generation = state["generations"][&page].as_u64().unwrap_or(0);
        if ink
            && (command["index"].as_u64() != Some(index as u64)
                || command["generation"].as_u64() != Some(generation))
        {
            return Err(Error("playback_conflict"));
        }
        let mut event = json!({"kind":action,"epoch":state["epoch"],"at":time,"clientId":command["clientId"],"commandId":id});
        match action {
            "next" => {
                let counts = state["counts"]
                    .as_array()
                    .ok_or(Error("playback_invalid"))?;
                if step < counts[index].as_u64().unwrap_or(0) {
                    step += 1
                } else if index + 1 < counts.len() {
                    index += 1;
                    step = 0
                }
                state["at"] = json!(time + 80);
            }
            "previous" => {
                if step > 0 {
                    step -= 1
                } else if index > 0 {
                    index -= 1;
                    step = state["counts"][index].as_u64().unwrap_or(0)
                }
                state["at"] = json!(0);
            }
            "black" => state["black"] = json!(!state["black"].as_bool().unwrap_or(false)),
            "end" => {
                let _ = live
                    .sender
                    .send(json!({"kind":"end","epoch":state["epoch"]}));
                lives.remove(&grant.key);
                return Ok(json!({"ok":true}));
            }
            "ink" => {
                if state["black"] == true {
                    return Err(Error("playback_conflict"));
                }
                let mut stroke = command["stroke"].clone();
                let stroke_id = stroke["id"]
                    .as_str()
                    .ok_or(Error("playback_invalid"))?
                    .to_owned();
                if !state["erased"][&stroke_id].is_null() {
                    return Err(Error("playback_conflict"));
                }
                let old = &state["ink"][&stroke_id];
                if !old.is_null()
                    && (old["clientId"] != command["clientId"]
                        || old["index"].as_u64() != Some(index as u64))
                {
                    return Err(Error("playback_conflict"));
                }
                if old["points"].as_array().is_some_and(|p| {
                    p.len() > stroke["points"].as_array().map(Vec::len).unwrap_or(0)
                }) {
                    return Ok(json!({"ok":true}));
                }
                if old.is_null() && state["ink"].as_object().map(|v| v.len()).unwrap_or(0) >= 512 {
                    return Err(Error("playback_capacity"));
                }
                stroke["index"] = json!(index);
                stroke["clientId"] = command["clientId"].clone();
                stroke["generation"] = json!(generation);
                state["ink"][&stroke_id] = stroke.clone();
                event["stroke"] = stroke;
            }
            "erase" => {
                let stroke_id = command["strokeId"]
                    .as_str()
                    .ok_or(Error("playback_invalid"))?;
                let old = &state["ink"][stroke_id];
                if !old.is_null() {
                    if old["index"].as_u64() != Some(index as u64) {
                        return Err(Error("playback_conflict"));
                    }
                    if state["erased"].as_object().map(|v| v.len()).unwrap_or(0) >= 4096 {
                        return Err(Error("playback_capacity"));
                    }
                    state["erased"][stroke_id] = json!(index);
                    state["ink"]
                        .as_object_mut()
                        .ok_or(Error("playback_invalid"))?
                        .remove(stroke_id);
                }
                event["strokeId"] = json!(stroke_id);
            }
            "clear" => {
                state["ink"]
                    .as_object_mut()
                    .ok_or(Error("playback_invalid"))?
                    .retain(|_, v| v["index"].as_u64() != Some(index as u64));
                state["erased"]
                    .as_object_mut()
                    .ok_or(Error("playback_invalid"))?
                    .retain(|_, v| v.as_u64() != Some(index as u64));
                state["generations"][&page] = json!(generation + 1);
                event["generation"] = json!(generation + 1);
            }
            "laser" => {
                if state["black"] == true {
                    return Err(Error("playback_conflict"));
                }
                event["point"] = command["point"].clone();
                event["index"] = json!(index);
                let _ = live.sender.send(event);
                return Ok(json!({"ok":true}));
            }
            _ => return Err(Error("playback_invalid")),
        }
        state["index"] = json!(index);
        state["step"] = json!(step);
        if !ink {
            state["revision"] = json!(state["revision"].as_u64().unwrap_or(0) + 1);
        }
        state["seq"] = json!(state["seq"].as_u64().unwrap_or(0) + 1);
        event["seq"] = state["seq"].clone();
        event["index"] = json!(index);
        event["position"] = json!({"index":index,"step":step,"black":state["black"],"at":state["at"],"revision":state["revision"]});
        live.state = state;
        live.expires = time + LIVE_TTL_MS;
        if live.commands.len() >= 2048 {
            live.commands.pop_front();
        }
        live.commands.push_back((id.into(), digest));
        let sequence = live.state["seq"].clone();
        let _ = live.sender.send(event);
        Ok(json!({"ok":true,"seq":sequence}))
    }
}
