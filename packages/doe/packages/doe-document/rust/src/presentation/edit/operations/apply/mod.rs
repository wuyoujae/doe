// Origin: app/backend/core/src/doe_slide_edit/operations.rs::apply
use super::*;


pub fn apply(original: &Value, edit: &Edit) -> Result<Value, String> {
    if edit.operations.len() > 128 || (edit.slide.is_some() == !edit.operations.is_empty()) {
        return Err("doe_slide_edit_supply_operations_or_one_slide".into());
    }
    let mut candidate = original.clone();
    if let Some(slide) = &edit.slide {
        candidate = slide.clone();
    }
    for operation in &edit.operations {
        let root = nodes(&mut candidate)?;
        match operation {
            Operation::Set {
                node_id,
                path,
                value,
            } => set_field(
                find(root, node_id).ok_or("doe_slide_edit_node_missing")?,
                path,
                Some(value),
            )?,
            Operation::RemoveField { node_id, path } => set_field(
                find(root, node_id).ok_or("doe_slide_edit_node_missing")?,
                path,
                None,
            )?,
            Operation::ReplaceNode { node_id, node } => {
                if node["id"] != *node_id {
                    return Err("doe_slide_edit_node_identity_changed".into());
                }
                if !remove(root, node_id, Some(node)) {
                    return Err("doe_slide_edit_node_missing".into());
                }
            }
            Operation::RemoveNode { node_id } => {
                if !remove(root, node_id, None) {
                    return Err("doe_slide_edit_node_missing".into());
                }
            }
            Operation::InsertNode {
                parent_id,
                before_id,
                node,
            } => {
                let target = if let Some(parent) = parent_id {
                    find(root, parent)
                        .and_then(|n| n.get_mut("children"))
                        .and_then(Value::as_array_mut)
                        .ok_or("doe_slide_edit_parent_missing")?
                } else {
                    root
                };
                let index = if let Some(before) = before_id {
                    target
                        .iter()
                        .position(|n| n["id"] == *before)
                        .ok_or("doe_slide_edit_anchor_missing")?
                } else {
                    target.len()
                };
                target.insert(index, node.clone());
            }
        }
    }
    if candidate["id"] != original["id"] || candidate["size"] != original["size"] {
        return Err("doe_slide_edit_page_identity_or_size_changed".into());
    }
    if candidate.to_string().len() > 2_000_000 {
        return Err("doe_slide_edit_page_too_large".into());
    }
    Ok(candidate)
}
