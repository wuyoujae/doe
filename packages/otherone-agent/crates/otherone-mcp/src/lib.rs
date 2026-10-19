// 作用：MCP (Model Context Protocol) — 客户端实现
// 关联：被 Agent 使用，连接外部 MCP 工具服务器
// 预期结果：支持连接 MCP server，发现工具，调用工具

pub mod client;
pub mod error;
pub mod types;

use client::McpClient;
use error::McpError;
use otherone_tools::types::{ToolCallContext, ToolError};
use otherone_tools::{ToolHandler, ToolRegistration};
use std::sync::Arc;
use tokio::sync::Mutex;
use types::McpServerConfig;

/// MCP 管理器
/// 作用：管理多个 MCP server 连接，聚合所有 tool 定义
/// 关联：被 Agent 初始化时创建，注册 MCP server 列表
/// 预期结果：连接所有配置的 MCP server，提供统一的工具查询接口
pub struct McpManager {
    clients: Vec<McpClient>,
}

impl McpManager {
    /// 创建空的 MCP 管理器
    pub fn new() -> Self {
        McpManager {
            clients: Vec::new(),
        }
    }

    /// 连接到一个 MCP server
    /// 作用：建立与 MCP server 的连接，初始化并发现可用工具
    /// 关联：用户配置 mcp_servers 后调用
    /// 预期结果：成功连接并缓存工具列表，失败时返回错误
    pub async fn connect(&mut self, config: &McpServerConfig) -> Result<(), McpError> {
        let mut client = McpClient::new(config.clone());
        client.initialize().await?;
        self.clients.push(client);
        Ok(())
    }

    /// 获取所有 MCP server 的工具列表
    /// 作用：聚合所有已连接 MCP server 的 tool 定义
    /// 关联：被 combine_context / invoke_agent 调用
    /// 预期结果：返回所有 server 的工具定义数组
    pub fn get_all_tools(&self) -> Vec<otherone_ai::types::Tool> {
        self.clients.iter().flat_map(|c| c.get_tools()).collect()
    }

    /// 在所有 MCP server 中查找并调用工具
    /// 作用：遍历所有 client 查找匹配的 tool name 并执行
    /// 关联：被 process_tools 调用
    /// 预期结果：找到匹配工具并调用，未找到返回错误
    pub async fn call_tool(
        &mut self,
        tool_name: &str,
        arguments: &serde_json::Value,
    ) -> Result<serde_json::Value, McpError> {
        for client in &mut self.clients {
            if client.has_tool(tool_name) {
                return client.call_tool(tool_name, arguments).await;
            }
        }
        Err(McpError::ToolNotFound(format!(
            "Tool '{}' not found in any connected MCP server",
            tool_name
        )))
    }

    /// 断开所有 MCP server 连接
    pub async fn disconnect_all(&mut self) {
        for client in &mut self.clients {
            let _ = client.shutdown().await;
        }
        self.clients.clear();
    }

    /// 获取已连接的 server 数量
    pub fn server_count(&self) -> usize {
        self.clients.len()
    }

    /// 获取所有工具的总数
    pub fn tool_count(&self) -> usize {
        self.clients.iter().map(|c| c.tool_count()).sum()
    }

    /// 将所有已发现的 MCP 工具转换成 Multi-Agent Runtime 的异步工具注册项。
    /// 返回的 handler 共享同一个 manager，并按 manager 锁保证客户端状态安全。
    pub fn into_tool_registrations(self) -> Vec<ToolRegistration> {
        let definitions = self.get_all_tools();
        let manager = Arc::new(Mutex::new(self));
        definitions
            .into_iter()
            .map(|definition| {
                let tool_name = definition.function.name.clone();
                ToolRegistration::new(
                    definition,
                    Arc::new(McpToolHandler {
                        manager: Arc::clone(&manager),
                        tool_name,
                    }),
                )
            })
            .collect()
    }
}

struct McpToolHandler {
    manager: Arc<Mutex<McpManager>>,
    tool_name: String,
}

#[async_trait::async_trait]
impl ToolHandler for McpToolHandler {
    async fn call(
        &self,
        arguments: serde_json::Value,
        _context: ToolCallContext,
    ) -> Result<serde_json::Value, ToolError> {
        let mut manager = self.manager.lock().await;
        manager
            .call_tool(&self.tool_name, &arguments)
            .await
            .map_err(|error| ToolError::recoverable(error.to_string()))
    }
}

impl Default for McpManager {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for McpManager {
    fn drop(&mut self) {
        // MCP 管理器释放时不保证异步清理
        // 用户应在使用完毕后手动调用 disconnect_all()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mcp_manager_new() {
        let manager = McpManager::new();
        assert_eq!(manager.server_count(), 0);
        assert_eq!(manager.tool_count(), 0);
    }

    #[test]
    fn empty_manager_produces_no_runtime_tool_registrations() {
        let manager = McpManager::new();
        assert!(manager.into_tool_registrations().is_empty());
    }
}
