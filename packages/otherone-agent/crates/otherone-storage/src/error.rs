// 作用：存储模块的错误类型
// 关联：被 storage 内部使用

use thiserror::Error;

#[derive(Error, Debug)]
pub enum StorageError {
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    #[cfg(feature = "postgres")]
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx_core::Error),

    #[error("MongoDB error: {0}")]
    MongoError(String),

    #[error("Redis error: {0}")]
    RedisError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Session not found: {0}")]
    SessionNotFound(String),

    #[error("Unsupported storage type: {0}")]
    UnsupportedStorageType(String),
}
