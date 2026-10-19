# Otherone

Otherone is a Rust AI agent framework with provider adapters, an agent loop, context management, tool calling, storage backends, Agent Skills discovery, and MCP client support.

## Crates

- `otherone`: primary facade crate that re-exports the framework API.
- `otherone-ai`: AI provider abstraction for OpenAI, Anthropic, Fetch, OpenRouter, and local OpenAI-compatible endpoints.
- `otherone-agent`: non-streaming and streaming agent loop.
- `otherone-context`: session context loading, token estimation, and compaction.
- `otherone-memory`: long-term memory tree primitives and local memory storage.
- `otherone-tools`: tool call parsing and execution helpers.
- `otherone-storage`: local file, SQL, MongoDB, and Redis storage support.
- `otherone-skills`: Agent Skills `SKILL.md` discovery and validation.
- `otherone-mcp`: Model Context Protocol client support.

## Install

Use the facade crate in another Rust project:

```toml
[dependencies]
otherone = "0.6.0"
```

During local development, depend on the workspace path:

```toml
[dependencies]
otherone = { path = "../otherone-agent/crates/otherone" }
```

## Minimal Usage

```rust
use otherone::{
    agent::types::{AiOptions, ContextLoadType, InputOptions},
    ai::types::ProviderType,
    Otherone,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let input = InputOptions {
        session_id: "demo".to_string(),
        context_load_type: ContextLoadType::LocalFile,
        storage_type: None,
        runtime_context: None,
        context_window: 8192,
        threshold_percentage: Some(0.8),
        max_iterations: Some(8),
        database_config: None,
        enable_long_term_memory: None,
        long_term_memory_recall_max_types: None,
    };

    let mut ai = AiOptions {
        provider: ProviderType::OpenAI,
        api_key: std::env::var("OPENAI_API_KEY")?,
        base_url: "https://api.openai.com/v1".to_string(),
        model: "gpt-4o-mini".to_string(),
        user_prompt: Some("Hello from Otherone".to_string()),
        system_prompt: None,
        messages: None,
        context_length: Some(8192),
        temperature: Some(0.7),
        top_p: None,
        tools: None,
        tools_realize: None,
        tool_choice: None,
        parallel_tool_calls: None,
        stream: None,
        other: None,
    };

    let response = Otherone::invoke_agent(&input, &mut ai, None).await?;
    println!("{}", response.content);
    Ok(())
}
```

## Multi-Agent Runtime

Agent definitions are peers. The application selects an entry Agent for each root run, and allowed
Agents may call each other through the built-in `otherone.call_agent` tool.

```rust
use otherone::{
    ai::types::ProviderType, AgentDefinition, AgentRunRequest, AgentRuntime, ModelProfile,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let model = ModelProfile::builder("default", ProviderType::OpenAI, "gpt-4o-mini")
        .api_key(std::env::var("OPENAI_API_KEY")?)
        .base_url("https://api.openai.com/v1")
        .build()?;

    let researcher = AgentDefinition::builder("researcher")
        .description("Research one focused question and return evidence.")
        .system_prompt("You are a focused research Agent.")
        .build()?;

    let coordinator = AgentDefinition::builder("coordinator")
        .description("Coordinate work and integrate specialist results.")
        .system_prompt("Delegate focused research when it improves the answer.")
        .allow_agents(["researcher"])
        .build()?;

    let runtime = AgentRuntime::builder()
        .register_model(model)
        .register_agent(coordinator)
        .register_agent(researcher)
        .build()?;

    let result = runtime
        .run(AgentRunRequest::new("coordinator", "Compare the available approaches"))
        .await?;

    println!("{:?}", result.output);
    Ok(())
}
```

The runtime provides typed events, cancellation, per-root budgets, child-session isolation,
Agent-call permissions, cycle protection, idempotency, async tools, Skills filtering, scoped memory,
and MCP tool adapters. Existing `Otherone::invoke_agent*` APIs remain available for compatibility.

## Package And Publish

Check package contents without publishing:

```bash
cargo package --workspace --allow-dirty
```

Publish dependency crates before crates that depend on them:

```bash
cargo login
cargo publish -p otherone-ai
cargo publish -p otherone-storage
cargo publish -p otherone-tools
cargo publish -p otherone-mcp
cargo publish -p otherone-context
cargo publish -p otherone-agent
cargo publish -p otherone
```

On Windows, you can use the included publish script:

```powershell
cargo login
.\scripts\publish.ps1
```

Crates.io requires each published dependency version to already exist, so the facade crate `otherone` should be published last.
