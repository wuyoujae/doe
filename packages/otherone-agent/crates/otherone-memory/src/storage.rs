use std::fs;
use std::path::PathBuf;
use std::sync::{OnceLock, RwLock};

use serde::{Deserialize, Serialize};

use crate::error::MemoryError;
use crate::tree::MemoryTree;
use crate::types::MemoryPoint;

static MEMORY_STORAGE_ROOT: OnceLock<RwLock<Option<PathBuf>>> = OnceLock::new();

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStorageFile {
    #[serde(default)]
    pub points: Vec<MemoryPoint>,
}

pub fn set_memory_storage_root(root: impl Into<PathBuf>) {
    let lock = MEMORY_STORAGE_ROOT.get_or_init(|| RwLock::new(None));
    if let Ok(mut configured_root) = lock.write() {
        *configured_root = Some(root.into());
    }
}

pub fn clear_memory_storage_root() {
    let lock = MEMORY_STORAGE_ROOT.get_or_init(|| RwLock::new(None));
    if let Ok(mut configured_root) = lock.write() {
        *configured_root = None;
    }
}

pub fn memory_storage_path() -> PathBuf {
    memory_storage_root()
        .join(".otherone")
        .join("memory")
        .join("long-term-memory.json")
}

pub fn read_memory_tree() -> Result<MemoryTree, MemoryError> {
    let path = memory_storage_path();

    if !path.exists() {
        let tree = MemoryTree::new();
        write_memory_tree(&tree)?;
        return Ok(tree);
    }

    let content =
        fs::read_to_string(&path).map_err(|error| MemoryError::IoError(error.to_string()))?;
    let storage_file: MemoryStorageFile = serde_json::from_str(&content)
        .map_err(|error| MemoryError::JsonError(error.to_string()))?;

    MemoryTree::from_points(storage_file.points)
}

pub fn write_memory_tree(tree: &MemoryTree) -> Result<(), MemoryError> {
    let path = memory_storage_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| MemoryError::IoError(error.to_string()))?;
    }

    let storage_file = MemoryStorageFile {
        points: tree.to_points(),
    };
    let content = serde_json::to_string_pretty(&storage_file)
        .map_err(|error| MemoryError::JsonError(error.to_string()))?;

    fs::write(&path, content).map_err(|error| MemoryError::IoError(error.to_string()))?;
    Ok(())
}

fn memory_storage_root() -> PathBuf {
    MEMORY_STORAGE_ROOT
        .get_or_init(|| RwLock::new(None))
        .read()
        .ok()
        .and_then(|configured_root| configured_root.clone())
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_and_writes_memory_tree_file() {
        let root = std::env::temp_dir().join(format!(
            "otherone-memory-storage-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        set_memory_storage_root(root.clone());

        let mut tree = MemoryTree::new();
        let root_id = tree
            .insert_root("likes noodles", "food preference")
            .unwrap();
        write_memory_tree(&tree).unwrap();

        let restored = read_memory_tree().unwrap();
        assert!(memory_storage_path().starts_with(&root));
        assert!(restored.contains(&root_id));

        clear_memory_storage_root();
    }
}
