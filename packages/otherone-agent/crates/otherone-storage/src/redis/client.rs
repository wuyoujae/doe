// 作用：Redis 客户端 — 提供 session 缓存层的存储能力
// 关联：被 storage/lib.rs 调用，作为可选的缓存加速层
// 预期结果：支持 Redis 连接、session 读写、过期时间设置

use crate::error::StorageError;
use redis::aio::ConnectionManager;
use redis::AsyncCommands;

/// Redis 存储客户端
/// 作用：封装 Redis 连接，提供 session 缓存读写
/// 关联：与 localfile/database 互补，提供高速缓存层
/// 预期结果：支持 Redis 的基本 CRUD 操作
pub struct RedisClient {
    manager: ConnectionManager,
}

impl RedisClient {
    /// 创建新的 Redis 客户端
    /// 作用：连接到 Redis server
    /// 关联：被用户调用，配置 Redis 存储后端
    /// 预期结果：返回已连接的 RedisClient
    pub async fn new(redis_url: &str) -> Result<Self, StorageError> {
        let client = redis::Client::open(redis_url)
            .map_err(|e| StorageError::ConfigError(format!("Invalid Redis URL: {}", e)))?;

        let manager = ConnectionManager::new(client)
            .await
            .map_err(|e| StorageError::ConfigError(format!("Failed to connect to Redis: {}", e)))?;

        Ok(RedisClient { manager })
    }

    /// 写入缓存数据
    /// 作用：将 session 数据写入 Redis，支持设置过期时间
    /// 关联：被 write_entry 调用，作为写入的加速缓存
    /// 预期结果：数据写入 Redis，成功返回 Ok
    pub async fn set(
        &mut self,
        key: &str,
        value: &str,
        ttl_seconds: Option<u64>,
    ) -> Result<(), StorageError> {
        let _: () = self
            .manager
            .set(key, value)
            .await
            .map_err(|e| StorageError::ConfigError(format!("Redis SET failed: {}", e)))?;

        if let Some(ttl) = ttl_seconds {
            let _: () =
                self.manager.expire(key, ttl as i64).await.map_err(|e| {
                    StorageError::ConfigError(format!("Redis EXPIRE failed: {}", e))
                })?;
        }

        Ok(())
    }

    /// 读取缓存数据
    /// 作用：从 Redis 读取 session 数据
    /// 关联：被 read_session_data 调用
    /// 预期结果：返回缓存的值，或 None（不存在时）
    pub async fn get(&mut self, key: &str) -> Result<Option<String>, StorageError> {
        let result: Option<String> = self
            .manager
            .get(key)
            .await
            .map_err(|e| StorageError::ConfigError(format!("Redis GET failed: {}", e)))?;
        Ok(result)
    }

    /// 删除缓存数据
    pub async fn delete(&mut self, key: &str) -> Result<(), StorageError> {
        let _: () = self
            .manager
            .del(key)
            .await
            .map_err(|e| StorageError::ConfigError(format!("Redis DEL failed: {}", e)))?;
        Ok(())
    }

    /// 检查 key 是否存在
    pub async fn exists(&mut self, key: &str) -> Result<bool, StorageError> {
        let result: bool = self
            .manager
            .exists(key)
            .await
            .map_err(|e| StorageError::ConfigError(format!("Redis EXISTS failed: {}", e)))?;
        Ok(result)
    }

    /// 生成 session 的 Redis key
    pub fn session_key(session_id: &str) -> String {
        format!("otherone:session:{}", session_id)
    }

    /// 生成 entry 的 Redis key
    pub fn entry_key(session_id: &str, entry_id: &str) -> String {
        format!("otherone:entry:{}:{}", session_id, entry_id)
    }

    /// 默认 TTL（24小时）
    pub fn default_ttl() -> u64 {
        86400
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_key() {
        let key = RedisClient::session_key("abc-123");
        assert_eq!(key, "otherone:session:abc-123");
    }

    #[test]
    fn test_entry_key() {
        let key = RedisClient::entry_key("session-1", "entry-1");
        assert_eq!(key, "otherone:entry:session-1:entry-1");
    }

    #[test]
    fn test_default_ttl() {
        assert_eq!(RedisClient::default_ttl(), 86400);
    }
}
