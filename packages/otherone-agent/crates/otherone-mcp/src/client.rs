// MCP 客户端 — 管理与单个 MCP server 的通信
use std::process::Stdio;
use std::sync::atomic::{AtomicU64, Ordering};
use tokio::io::{AsyncBufRead, AsyncBufReadExt, AsyncWrite, AsyncWriteExt, BufReader, BufWriter};
use tokio::process::{Child, ChildStdin, ChildStdout, Command};

use crate::error::McpError;
use crate::types::*;

pub struct McpClient {
    config: McpServerConfig,
    tools: Vec<McpTool>,
    request_id: AtomicU64,
    child_process: Option<Child>,
    stdio_writer: Option<BufWriter<ChildStdin>>,
    stdio_reader: Option<BufReader<ChildStdout>>,
    http_client: Option<reqwest::Client>,
}

impl McpClient {
    pub fn new(config: McpServerConfig) -> Self {
        McpClient {
            config,
            tools: vec![],
            request_id: AtomicU64::new(0),
            child_process: None,
            stdio_writer: None,
            stdio_reader: None,
            http_client: None,
        }
    }

    fn next_id(&self) -> u64 {
        self.request_id.fetch_add(1, Ordering::SeqCst)
    }

    fn build_request(&self, method: &str, params: Option<serde_json::Value>) -> JsonRpcRequest {
        JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            id: self.next_id(),
            method: method.to_string(),
            params,
        }
    }

    pub async fn initialize(&mut self) -> Result<(), McpError> {
        match self.config.transport.as_str() {
            "stdio" => self.init_stdio().await,
            "sse" | "streamable_http" => self.init_http().await,
            o => Err(McpError::UnsupportedTransport(o.to_string())),
        }
    }

    async fn init_stdio(&mut self) -> Result<(), McpError> {
        let cmd_str = self
            .config
            .command
            .as_ref()
            .ok_or(McpError::ConfigError("command required".into()))?;
        let mut cmd = Command::new(cmd_str);
        if let Some(ref args) = self.config.args {
            cmd.args(args);
        }
        if let Some(ref env) = self.config.env {
            for (k, v) in env {
                cmd.env(k, v);
            }
        }
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .kill_on_drop(true);
        let mut child = cmd
            .spawn()
            .map_err(|e| McpError::ConnectionError(format!("spawn: {}", e)))?;
        let stdin = child
            .stdin
            .take()
            .ok_or(McpError::ConnectionError("stdin".into()))?;
        let stdout = child
            .stdout
            .take()
            .ok_or(McpError::ConnectionError("stdout".into()))?;
        let mut w = BufWriter::new(stdin);
        let mut r = BufReader::new(stdout);

        let init = self.build_request("initialize", Some(serde_json::json!({
            "protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"otherone-mcp","version":"0.1.0"}
        })));
        write_json_line(&mut w, &init).await?;
        let init_response = read_json_rpc_response(&mut r, init.id).await?;
        ensure_success(&init_response)?;

        let notif = r#"{"jsonrpc":"2.0","method":"notifications/initialized"}"#.to_string() + "\n";
        w.write_all(notif.as_bytes()).await?;
        w.flush().await?;

        let tools_req = self.build_request("tools/list", None);
        write_json_line(&mut w, &tools_req).await?;
        let resp = read_json_rpc_response(&mut r, tools_req.id).await?;
        ensure_success(&resp)?;
        if let Some(result) = resp.result {
            let tl: ToolsListResult = serde_json::from_value(result)
                .map_err(|e| McpError::ProtocolError(format!("tools: {}", e)))?;
            self.tools = tl.tools;
        }
        self.stdio_writer = Some(w);
        self.stdio_reader = Some(r);
        self.child_process = Some(child);
        Ok(())
    }

    async fn init_http(&mut self) -> Result<(), McpError> {
        let url = self
            .config
            .url
            .clone()
            .ok_or(McpError::ConfigError("url required".into()))?;
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            reqwest::header::CONTENT_TYPE,
            reqwest::header::HeaderValue::from_static("application/json"),
        );
        if let Some(ref key) = self.config.api_key {
            headers.insert(
                reqwest::header::AUTHORIZATION,
                reqwest::header::HeaderValue::from_str(&format!("Bearer {}", key))
                    .map_err(|e| McpError::ConfigError(format!("key: {}", e)))?,
            );
        }
        let client = reqwest::Client::builder()
            .default_headers(headers)
            .build()
            .map_err(|e| McpError::ConnectionError(format!("client: {}", e)))?;

        let init = self.build_request("initialize", Some(serde_json::json!({
            "protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"otherone-mcp","version":"0.1.0"}
        })));
        let _: JsonRpcResponse = client
            .post(&url)
            .json(&init)
            .send()
            .await
            .map_err(|e| McpError::ConnectionError(format!("init: {}", e)))?
            .json()
            .await
            .map_err(|e| McpError::ProtocolError(format!("parse: {}", e)))?;

        let tools_req = self.build_request("tools/list", None);
        let resp: JsonRpcResponse = client
            .post(&url)
            .json(&tools_req)
            .send()
            .await
            .map_err(|e| McpError::ConnectionError(format!("tools: {}", e)))?
            .json()
            .await
            .map_err(|e| McpError::ProtocolError(format!("parse: {}", e)))?;
        if let Some(result) = resp.result {
            let tl: ToolsListResult = serde_json::from_value(result)
                .map_err(|e| McpError::ProtocolError(format!("tools: {}", e)))?;
            self.tools = tl.tools;
        }
        self.http_client = Some(client);
        Ok(())
    }

    pub fn has_tool(&self, name: &str) -> bool {
        self.tools.iter().any(|t| t.name == name)
    }

    pub async fn call_tool(
        &mut self,
        name: &str,
        arguments: &serde_json::Value,
    ) -> Result<serde_json::Value, McpError> {
        let params = ToolCallParams {
            name: name.to_string(),
            arguments: arguments.clone(),
        };
        let req = self.build_request("tools/call", Some(serde_json::to_value(&params)?));
        if let Some(ref client) = self.http_client {
            let url = self
                .config
                .url
                .as_ref()
                .ok_or(McpError::ConfigError("url required".into()))?;
            let resp: JsonRpcResponse = client
                .post(url)
                .json(&req)
                .send()
                .await
                .map_err(|e| McpError::ConnectionError(format!("call: {}", e)))?
                .json()
                .await
                .map_err(|e| McpError::ProtocolError(format!("parse: {}", e)))?;
            if let Some(err) = resp.error {
                return Err(McpError::ToolCallError(format!(
                    "[{}]: {}",
                    err.code, err.message
                )));
            }
            Ok(resp.result.unwrap_or(serde_json::Value::Null))
        } else if self.stdio_writer.is_some() && self.stdio_reader.is_some() {
            let writer = self
                .stdio_writer
                .as_mut()
                .ok_or_else(|| McpError::ConnectionError("stdio writer is closed".into()))?;
            write_json_line(writer, &req).await?;
            let reader = self
                .stdio_reader
                .as_mut()
                .ok_or_else(|| McpError::ConnectionError("stdio reader is closed".into()))?;
            let resp = read_json_rpc_response(reader, req.id).await?;
            ensure_success(&resp)?;
            Ok(resp.result.unwrap_or(serde_json::Value::Null))
        } else {
            Err(McpError::ConnectionError(
                "MCP client is not initialized".into(),
            ))
        }
    }

    pub fn get_tools(&self) -> Vec<otherone_ai::types::Tool> {
        self.tools
            .iter()
            .map(|t| otherone_ai::types::Tool {
                tool_type: "function".to_string(),
                function: otherone_ai::types::FunctionDefinition {
                    name: t.name.clone(),
                    description: t.description.clone(),
                    parameters: Some(t.input_schema.clone()),
                },
            })
            .collect()
    }

    pub fn tool_count(&self) -> usize {
        self.tools.len()
    }

    pub async fn shutdown(&mut self) -> Result<(), McpError> {
        if let Some(ref mut c) = self.child_process {
            let _ = c.kill().await;
        }
        self.stdio_writer = None;
        self.stdio_reader = None;
        self.child_process = None;
        self.http_client = None;
        Ok(())
    }
}

async fn write_json_line<W, T>(writer: &mut W, value: &T) -> Result<(), McpError>
where
    W: AsyncWrite + Unpin,
    T: serde::Serialize,
{
    let line = serde_json::to_string(value)? + "\n";
    writer.write_all(line.as_bytes()).await?;
    writer.flush().await?;
    Ok(())
}

async fn read_json_rpc_response<R>(
    reader: &mut R,
    expected_id: u64,
) -> Result<JsonRpcResponse, McpError>
where
    R: AsyncBufRead + Unpin,
{
    loop {
        let mut line = String::new();
        let read = reader
            .read_line(&mut line)
            .await
            .map_err(|error| McpError::ProtocolError(format!("read: {error}")))?;
        if read == 0 {
            return Err(McpError::ConnectionError(
                "MCP stdio server closed stdout".to_string(),
            ));
        }
        let value: serde_json::Value = serde_json::from_str(&line)
            .map_err(|error| McpError::ProtocolError(format!("parse: {error}")))?;
        if value.get("id").and_then(|id| id.as_u64()) != Some(expected_id) {
            continue;
        }
        return serde_json::from_value(value)
            .map_err(|error| McpError::ProtocolError(format!("response: {error}")));
    }
}

fn ensure_success(response: &JsonRpcResponse) -> Result<(), McpError> {
    if let Some(error) = &response.error {
        return Err(McpError::ToolCallError(format!(
            "[{}]: {}",
            error.code, error.message
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn stdio_response_reader_skips_notifications_and_matches_request_id() {
        let input = concat!(
            "{\"jsonrpc\":\"2.0\",\"method\":\"notifications/tools/list_changed\"}\n",
            "{\"jsonrpc\":\"2.0\",\"id\":7,\"result\":{\"ok\":true}}\n"
        );
        let mut reader = BufReader::new(input.as_bytes());
        let response = read_json_rpc_response(&mut reader, 7).await.unwrap();
        assert_eq!(response.id, Some(7));
        assert_eq!(response.result.unwrap()["ok"], true);
    }
}
