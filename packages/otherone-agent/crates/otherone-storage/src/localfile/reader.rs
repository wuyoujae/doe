// 作用：本地 JSON 文件读取操作
// 关联：被 localfile/mod.rs 和 storage/lib.rs 调用
// 预期结果：读取 .otherone/storage/otherone-storage.json 文件，返回 session 数据

use std::fs;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock, RwLock};

use crate::types::{Session, SessionData, StorageFile};

static STORAGE_ROOT: OnceLock<RwLock<Option<PathBuf>>> = OnceLock::new();
static STORAGE_IO_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub(crate) fn storage_io_lock() -> &'static Mutex<()> {
    STORAGE_IO_LOCK.get_or_init(|| Mutex::new(()))
}

#[cfg(test)]
pub(crate) fn storage_test_lock() -> &'static Mutex<()> {
    static TEST_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    TEST_LOCK.get_or_init(|| Mutex::new(()))
}

pub fn set_storage_root(root: impl Into<PathBuf>) {
    let lock = STORAGE_ROOT.get_or_init(|| RwLock::new(None));
    if let Ok(mut configured_root) = lock.write() {
        *configured_root = Some(root.into());
    }
}

pub fn clear_storage_root() {
    let lock = STORAGE_ROOT.get_or_init(|| RwLock::new(None));
    if let Ok(mut configured_root) = lock.write() {
        *configured_root = None;
    }
}

/// 获取存储文件路径
pub fn get_storage_path() -> PathBuf {
    storage_root()
        .join(".otherone")
        .join("storage")
        .join("otherone-storage.json")
}

fn storage_root() -> PathBuf {
    STORAGE_ROOT
        .get_or_init(|| RwLock::new(None))
        .read()
        .ok()
        .and_then(|configured_root| configured_root.clone())
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
}

/// 读取本地存储文件
/// 作用：读取 .otherone/storage/otherone-storage.json 文件
/// 关联：被 ReadSessionData 和 GetAllSessions 调用
/// 预期结果：返回解析后的存储数据对象，文件不存在时创建初始文件
pub fn read_storage_file() -> Result<StorageFile, crate::error::StorageError> {
    let _guard = storage_io_lock().lock().map_err(|_| {
        crate::error::StorageError::ConfigError("local storage lock poisoned".to_string())
    })?;
    read_storage_file_unlocked()
}

pub(crate) fn read_storage_file_unlocked() -> Result<StorageFile, crate::error::StorageError> {
    let storage_path = get_storage_path();

    if !storage_path.exists() {
        // 创建目录和初始文件
        if let Some(parent) = storage_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let initial_data = StorageFile {
            sessions: Vec::new(),
        };

        let json = serde_json::to_string_pretty(&initial_data)?;
        fs::write(&storage_path, json)?;
        return Ok(initial_data);
    }

    let content = fs::read_to_string(&storage_path)?;
    let data: StorageFile = serde_json::from_str(&content)?;
    Ok(data)
}

/// 写入本地存储文件
/// 作用：将数据写入 .otherone/storage/otherone-storage.json 文件
/// 关联：被 localfile/writer.rs 调用
/// 预期结果：成功写入数据到文件
pub fn write_storage_file(data: &StorageFile) -> Result<(), crate::error::StorageError> {
    let _guard = storage_io_lock().lock().map_err(|_| {
        crate::error::StorageError::ConfigError("local storage lock poisoned".to_string())
    })?;
    write_storage_file_unlocked(data)
}

pub(crate) fn write_storage_file_unlocked(
    data: &StorageFile,
) -> Result<(), crate::error::StorageError> {
    let storage_path = get_storage_path();

    if let Some(parent) = storage_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let json = serde_json::to_string_pretty(data)?;
    fs::write(&storage_path, json)?;
    Ok(())
}

/// 查询所有 session 信息
/// 作用：获取所有会话列表（不包含 entries 和 compacted_entries）
/// 关联：被用户调用，用于获取所有会话列表
/// 预期结果：返回所有 session 的基本信息数组
pub fn get_all_sessions() -> Result<Vec<Session>, crate::error::StorageError> {
    get_all_sessions_with_internal(false)
}

/// 查询 session，可选择是否包含 Multi-Agent 内部子会话。
pub fn get_all_sessions_with_internal(
    include_internal: bool,
) -> Result<Vec<Session>, crate::error::StorageError> {
    let data = read_storage_file()?;

    let sessions = data
        .sessions
        .iter()
        .filter(|session| {
            include_internal
                || session
                    .metadata
                    .get("session_kind")
                    .and_then(|value| value.as_str())
                    != Some("agent_internal")
        })
        .map(|s| Session {
            partition_key: s.partition_key.clone(),
            session_id: s.session_id.clone(),
            status: s.status,
            create_at: s.create_at.clone(),
            attributes: s.attributes.clone(),
            metadata: s.metadata.clone(),
        })
        .collect();

    Ok(sessions)
}

/// 根据 session_id 读取该会话的所有数据
/// 作用：读取指定会话的 session、entries 和 compacted_entries
/// 关联：被 combine_context 调用
/// 预期结果：返回包含该会话所有相关数据的对象，session 不存在则返回空数据结构
pub fn read_session_data(session_id: &str) -> Result<SessionData, crate::error::StorageError> {
    if session_id.is_empty() {
        return Err(crate::error::StorageError::ConfigError(
            "session_id is required".to_string(),
        ));
    }

    let data = read_storage_file()?;

    // 查找指定的 session
    let session = data
        .sessions
        .iter()
        .find(|s| s.session_id == session_id && s.status == 0);

    match session {
        None => Ok(SessionData {
            session: None,
            entries: Vec::new(),
            compacted_entries: Vec::new(),
        }),
        Some(s) => Ok(SessionData {
            session: Some(Session {
                partition_key: s.partition_key.clone(),
                session_id: s.session_id.clone(),
                status: s.status,
                create_at: s.create_at.clone(),
                attributes: s.attributes.clone(),
                metadata: s.metadata.clone(),
            }),
            entries: s.entries.clone(),
            compacted_entries: s.compacted_entries.clone(),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_read_session_data_empty_id() {
        let result = read_session_data("");
        assert!(result.is_err());
    }

    #[test]
    fn storage_root_can_be_configured_without_changing_current_dir() {
        let _guard = storage_test_lock().lock().unwrap();
        let root = std::env::temp_dir().join(format!(
            "otherone-storage-root-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        set_storage_root(root.clone());

        let path = get_storage_path();
        assert!(path.starts_with(&root));

        let data = read_storage_file().unwrap();
        assert!(data.sessions.is_empty());
        assert!(path.exists());

        clear_storage_root();
    }
}
