// 作用：本地 JSON 文件写入操作
// 关联：被 localfile/mod.rs 和 storage/lib.rs 调用
// 预期结果：将 entry 和 compacted_entry 数据写入 .otherone/storage/otherone-storage.json 文件

use chrono::Utc;
use uuid::Uuid;

use super::reader::{read_storage_file_unlocked, storage_io_lock, write_storage_file_unlocked};
use crate::error::StorageError;
use crate::types::StorageSession;

/// 创建新的 session
/// 作用：生成新的 session_id 并插入到存储文件中
/// 关联：被用户调用，用于开始新的对话会话
/// 预期结果：返回新生成的 session_id
pub fn create_new_session() -> Result<String, StorageError> {
    let _guard = storage_io_lock()
        .lock()
        .map_err(|_| StorageError::ConfigError("local storage lock poisoned".to_string()))?;
    let mut data = read_storage_file_unlocked()?;

    let session_id = Uuid::new_v4().to_string();

    let new_session = StorageSession {
        partition_key: None,
        session_id: session_id.clone(),
        status: 0,
        create_at: Utc::now().to_rfc3339(),
        attributes: Default::default(),
        metadata: Default::default(),
        entries: Vec::new(),
        compacted_entries: Vec::new(),
    };

    data.sessions.push(new_session);
    write_storage_file_unlocked(&data)?;

    Ok(session_id)
}

/// 将 entry 写入本地 JSON 文件
/// 作用：将 entry 数据追加到 session 的 entries 数组中
/// 关联：被 storage/lib.rs 的 write_entry 调用
/// 预期结果：entry 数据成功写入文件
pub fn write_entry_to_file(
    session_id: &str,
    role: &str,
    content: &str,
    tools: Option<&serde_json::Value>,
    token_consumption: Option<u32>,
    create_at: Option<&str>,
    metadata: &crate::types::AttributeBag,
) -> Result<(), StorageError> {
    let _guard = storage_io_lock()
        .lock()
        .map_err(|_| StorageError::ConfigError("local storage lock poisoned".to_string()))?;
    let mut data = read_storage_file_unlocked()?;

    // 查找或创建 session
    let session = data
        .sessions
        .iter_mut()
        .find(|s| s.session_id == session_id);

    match session {
        Some(s) => {
            let entry_id = Uuid::new_v4().to_string();
            let new_entry = crate::types::Entry {
                partition_key: None,
                entry_id,
                session_id: session_id.to_string(),
                content: content.to_string(),
                role: role.to_string(),
                token_consumption,
                status: 0,
                tools: tools.cloned(),
                create_at: create_at
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| Utc::now().to_rfc3339()),
                is_compaction: 1,
                attributes: Default::default(),
                metadata: metadata.clone(),
            };
            s.entries.push(new_entry);
        }
        None => {
            let entry_id = Uuid::new_v4().to_string();
            let new_entry = crate::types::Entry {
                partition_key: None,
                entry_id,
                session_id: session_id.to_string(),
                content: content.to_string(),
                role: role.to_string(),
                token_consumption,
                status: 0,
                tools: tools.cloned(),
                create_at: create_at
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| Utc::now().to_rfc3339()),
                is_compaction: 1,
                attributes: Default::default(),
                metadata: metadata.clone(),
            };

            let new_session = StorageSession {
                partition_key: None,
                session_id: session_id.to_string(),
                status: 0,
                create_at: Utc::now().to_rfc3339(),
                attributes: Default::default(),
                metadata: metadata.clone(),
                entries: vec![new_entry],
                compacted_entries: Vec::new(),
            };
            data.sessions.push(new_session);
        }
    }

    write_storage_file_unlocked(&data)?;
    Ok(())
}

/// 将压缩记录写入本地 JSON 文件
/// 作用：将压缩记录追加到 session 的 compacted_entries 数组中
/// 关联：被 storage/lib.rs 的 write_compacted_entry 调用
/// 预期结果：压缩记录成功写入文件
pub fn write_compacted_entry_to_file(
    session_id: &str,
    summary: &str,
    trigger_entry_id: &str,
    create_at: Option<&str>,
    metadata: &crate::types::AttributeBag,
) -> Result<(), StorageError> {
    let _guard = storage_io_lock()
        .lock()
        .map_err(|_| StorageError::ConfigError("local storage lock poisoned".to_string()))?;
    let mut data = read_storage_file_unlocked()?;

    let session = data
        .sessions
        .iter_mut()
        .find(|s| s.session_id == session_id);

    let entry_id = Uuid::new_v4().to_string();
    let new_compacted = crate::types::CompactedEntry {
        partition_key: None,
        entry_id,
        session_id: session_id.to_string(),
        trigger_entry_id: trigger_entry_id.to_string(),
        summary: summary.to_string(),
        create_at: create_at
            .map(|s| s.to_string())
            .unwrap_or_else(|| Utc::now().to_rfc3339()),
        status: 0,
        attributes: Default::default(),
        metadata: metadata.clone(),
    };

    match session {
        Some(s) => {
            s.compacted_entries.push(new_compacted);
        }
        None => {
            let new_session = StorageSession {
                partition_key: None,
                session_id: session_id.to_string(),
                status: 0,
                create_at: Utc::now().to_rfc3339(),
                attributes: Default::default(),
                metadata: metadata.clone(),
                entries: Vec::new(),
                compacted_entries: vec![new_compacted],
            };
            data.sessions.push(new_session);
        }
    }

    write_storage_file_unlocked(&data)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_new_session() {
        let _guard = super::super::reader::storage_test_lock().lock().unwrap();
        let root = std::env::temp_dir().join(format!(
            "otherone-storage-session-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        super::super::reader::set_storage_root(root);
        // 这个测试验证 session_id 的格式
        let session_id = create_new_session().unwrap();
        assert!(!session_id.is_empty());
        // UUID v4 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        assert!(session_id.contains('-'));
        super::super::reader::clear_storage_root();
    }
}
