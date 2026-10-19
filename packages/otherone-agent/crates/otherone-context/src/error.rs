// 作用：上下文管理模块的错误类型
// 关联：被 otherone-context 内部使用

use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContextError {
    #[error("AI error: {0}")]
    AiError(#[from] otherone_ai::error::AiError),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Unsupported load type: {0}")]
    UnsupportedLoadType(String),

    #[error("Compaction error: {0}")]
    CompactionError(String),
}
