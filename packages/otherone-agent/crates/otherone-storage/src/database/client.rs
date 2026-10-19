// 作用：PostgreSQL 数据库连接客户端
// 关联：被 reader.rs 和 writer.rs 调用，提供数据库查询能力
// 预期结果：返回 sqlx PgPool 连接池

use sqlx_postgres::{PgPool, PgPoolOptions};

use crate::error::StorageError;
use crate::types::DatabaseConfig;

/// 创建数据库连接池
/// 作用：根据 DatabaseConfig 创建 sqlx 的 PostgreSQL 连接池
/// 关联：被 database reader/writer/init 调用
/// 预期结果：返回配置好的 PgPool，参数无效时抛出错误
pub async fn create_database_client(config: &DatabaseConfig) -> Result<PgPool, StorageError> {
    // 参数校验
    if config.host.is_empty() {
        return Err(StorageError::ConfigError("host is required".to_string()));
    }
    if config.port == 0 {
        return Err(StorageError::ConfigError("port is required".to_string()));
    }
    if config.database.is_empty() {
        return Err(StorageError::ConfigError(
            "database is required".to_string(),
        ));
    }
    if config.user.is_empty() {
        return Err(StorageError::ConfigError("user is required".to_string()));
    }
    if config.password.is_empty() {
        return Err(StorageError::ConfigError(
            "password is required".to_string(),
        ));
    }

    let database_url = format!(
        "postgres://{}:{}@{}:{}/{}",
        config.user, config.password, config.host, config.port, config.database
    );

    let pool = PgPoolOptions::new()
        .max_connections(config.max.unwrap_or(10))
        .acquire_timeout(std::time::Duration::from_millis(
            config.connection_timeout_millis.unwrap_or(2000),
        ))
        .idle_timeout(std::time::Duration::from_millis(
            config.idle_timeout_millis.unwrap_or(30000),
        ))
        .connect(&database_url)
        .await?;

    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_client_empty_host() {
        let config = DatabaseConfig {
            host: "".to_string(),
            port: 5432,
            database: "test".to_string(),
            user: "user".to_string(),
            password: "pass".to_string(),
            max: None,
            idle_timeout_millis: None,
            connection_timeout_millis: None,
        };
        let result = create_database_client(&config).await;
        assert!(result.is_err());
    }
}
