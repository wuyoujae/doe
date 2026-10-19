// Origin: app/backend/core/src/doe_slide_edit/operations.rs::set_field
use super::*;


pub(super) fn set_field(node: &mut Value, path: &str, value: Option<&Value>) -> Result<(), String> {
    // RFC 6901 paths are relative to a node. Identity/type/tree mutations use explicit operations.
    if !(path.starts_with("/props/") || path.starts_with("/layout/")) || path.len() > 512 {
        return Err("doe_slide_edit_invalid_field_path: use /props/... or /layout/...".into());
    }
    let (parent_path, key) = path
        .rsplit_once('/')
        .ok_or("doe_slide_edit_invalid_field_path")?;
    if key.contains('~') && key.replace("~1", "").replace("~0", "").contains('~') {
        return Err("doe_slide_edit_invalid_field_path".into());
    }
    let key = key.replace("~1", "/").replace("~0", "~");
    let parent = node
        .pointer_mut(parent_path)
        .ok_or("doe_slide_edit_field_parent_missing")?;
    match parent {
        Value::Object(object) => match value {
            Some(value) => {
                object.insert(key, value.clone());
            }
            None => {
                if object.remove(&key).is_none() {
                    return Err("doe_slide_edit_field_missing".into());
                }
            }
        },
        Value::Array(items) => {
            let index: usize = key
                .parse()
                .map_err(|_| "doe_slide_edit_invalid_array_index")?;
            let item = items
                .get_mut(index)
                .ok_or("doe_slide_edit_invalid_array_index")?;
            if let Some(value) = value {
                *item = value.clone();
            } else {
                return Err("doe_slide_edit_replace_array_to_remove_item".into());
            }
        }
        _ => return Err("doe_slide_edit_invalid_field_parent".into()),
    }
    Ok(())
}
