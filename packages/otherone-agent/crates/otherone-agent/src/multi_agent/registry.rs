use std::collections::{BTreeSet, HashMap};
use std::sync::Arc;

use otherone_ai::types::Tool;
use otherone_skills::{Skill, SkillRegistry};
use otherone_tools::ToolRegistry;

use crate::error::AgentError;

use super::types::{
    AccessPolicy, AgentAccessPolicy, AgentDefinition, AgentId, ModelProfile, ModelProfileId,
    ModelSelector, SkillAccessPolicy, ToolAccessPolicy,
};

pub const AGENT_CALL_TOOL_NAME: &str = "otherone.call_agent";
pub const MEMORY_RECALL_TOOL_NAME: &str = "memory.recall";
pub const MEMORY_STORE_TOOL_NAME: &str = "memory.store";

#[derive(Clone, Default)]
pub struct AgentRegistry {
    definitions: HashMap<AgentId, Arc<AgentDefinition>>,
}

impl AgentRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register(&mut self, definition: AgentDefinition) -> Result<(), AgentError> {
        definition.validate()?;
        if self.definitions.contains_key(&definition.id) {
            return Err(AgentError::InvalidConfiguration(format!(
                "agent '{}' is already registered",
                definition.id
            )));
        }
        self.definitions
            .insert(definition.id.clone(), Arc::new(definition));
        Ok(())
    }

    pub fn replace(&mut self, definition: AgentDefinition) -> Result<(), AgentError> {
        definition.validate()?;
        self.definitions
            .insert(definition.id.clone(), Arc::new(definition));
        Ok(())
    }

    pub fn get(&self, id: &AgentId) -> Option<Arc<AgentDefinition>> {
        self.definitions.get(id).cloned()
    }

    pub fn contains(&self, id: &AgentId) -> bool {
        self.definitions.contains_key(id)
    }

    pub fn len(&self) -> usize {
        self.definitions.len()
    }

    pub fn is_empty(&self) -> bool {
        self.definitions.is_empty()
    }

    pub fn ids(&self) -> Vec<AgentId> {
        let mut ids = self.definitions.keys().cloned().collect::<Vec<_>>();
        ids.sort();
        ids
    }

    pub fn snapshot(&self) -> AgentRegistrySnapshot {
        AgentRegistrySnapshot {
            definitions: self.definitions.clone(),
        }
    }
}

#[derive(Clone, Default)]
pub struct AgentRegistrySnapshot {
    definitions: HashMap<AgentId, Arc<AgentDefinition>>,
}

impl AgentRegistrySnapshot {
    pub fn get(&self, id: &AgentId) -> Option<Arc<AgentDefinition>> {
        self.definitions.get(id).cloned()
    }

    pub fn contains(&self, id: &AgentId) -> bool {
        self.definitions.contains_key(id)
    }

    pub fn ids(&self) -> Vec<AgentId> {
        let mut ids = self.definitions.keys().cloned().collect::<Vec<_>>();
        ids.sort();
        ids
    }
}

#[derive(Clone, Default)]
pub struct ModelRegistry {
    profiles: HashMap<ModelProfileId, Arc<ModelProfile>>,
}

impl ModelRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register(&mut self, profile: ModelProfile) -> Result<(), AgentError> {
        profile.validate()?;
        if self.profiles.contains_key(&profile.id) {
            return Err(AgentError::InvalidConfiguration(format!(
                "model profile '{}' is already registered",
                profile.id
            )));
        }
        self.profiles.insert(profile.id.clone(), Arc::new(profile));
        Ok(())
    }

    pub fn replace(&mut self, profile: ModelProfile) -> Result<(), AgentError> {
        profile.validate()?;
        self.profiles.insert(profile.id.clone(), Arc::new(profile));
        Ok(())
    }

    pub fn get(&self, id: &ModelProfileId) -> Option<Arc<ModelProfile>> {
        self.profiles.get(id).cloned()
    }

    pub fn contains(&self, id: &ModelProfileId) -> bool {
        self.profiles.contains_key(id)
    }

    pub fn ids(&self) -> Vec<ModelProfileId> {
        let mut ids = self.profiles.keys().cloned().collect::<Vec<_>>();
        ids.sort();
        ids
    }

    pub fn snapshot(&self) -> ModelRegistrySnapshot {
        ModelRegistrySnapshot {
            profiles: self.profiles.clone(),
        }
    }
}

#[derive(Clone, Default)]
pub struct ModelRegistrySnapshot {
    profiles: HashMap<ModelProfileId, Arc<ModelProfile>>,
}

impl ModelRegistrySnapshot {
    pub fn get(&self, id: &ModelProfileId) -> Option<Arc<ModelProfile>> {
        self.profiles.get(id).cloned()
    }
}

#[derive(Clone, Default)]
pub struct SkillRegistrySnapshot {
    skills: HashMap<String, Skill>,
}

impl SkillRegistrySnapshot {
    pub fn from_registry(registry: &SkillRegistry) -> Self {
        Self {
            skills: registry
                .get_all()
                .iter()
                .cloned()
                .map(|skill| (skill.name.clone(), skill))
                .collect(),
        }
    }

    pub fn contains(&self, name: &str) -> bool {
        self.skills.contains_key(name)
    }

    pub fn names(&self) -> Vec<String> {
        let mut names = self.skills.keys().cloned().collect::<Vec<_>>();
        names.sort();
        names
    }

    pub fn format_for_prompt(&self, policy: &SkillAccessPolicy) -> String {
        let mut skills = self
            .skills
            .values()
            .filter(|skill| !skill.disable_model_invocation)
            .filter(|skill| policy.allows(&skill.name))
            .collect::<Vec<_>>();
        skills.sort_by(|left, right| left.name.cmp(&right.name));
        if skills.is_empty() {
            return String::new();
        }

        let mut lines = vec![
            String::new(),
            "The following skills provide specialized instructions for specific tasks.".to_string(),
            "Use an allowed read tool to load a skill file when its description matches the task."
                .to_string(),
            "<available_skills>".to_string(),
        ];
        for skill in skills {
            lines.push("  <skill>".to_string());
            lines.push(format!("    <name>{}</name>", escape_xml(&skill.name)));
            lines.push(format!(
                "    <description>{}</description>",
                escape_xml(&skill.description)
            ));
            lines.push(format!(
                "    <location>{}</location>",
                escape_xml(&skill.file_path)
            ));
            lines.push("  </skill>".to_string());
        }
        lines.push("</available_skills>".to_string());
        lines.join("\n")
    }
}

fn escape_xml(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

#[derive(Debug, Clone)]
pub struct RuntimePolicy {
    pub tools: ToolAccessPolicy,
    pub skills: SkillAccessPolicy,
    pub callable_agents: AgentAccessPolicy,
    pub allow_recursive_calls: bool,
}

impl Default for RuntimePolicy {
    fn default() -> Self {
        Self {
            tools: AccessPolicy::All,
            skills: AccessPolicy::All,
            callable_agents: AccessPolicy::All,
            allow_recursive_calls: false,
        }
    }
}

pub type RuntimePolicySnapshot = RuntimePolicy;

#[derive(Clone)]
pub struct RuntimeSnapshot {
    pub version: String,
    pub default_model: ModelProfileId,
    pub agents: Arc<AgentRegistrySnapshot>,
    pub models: Arc<ModelRegistrySnapshot>,
    pub tools: Arc<ToolRegistry>,
    pub skills: Arc<SkillRegistrySnapshot>,
    pub policy: Arc<RuntimePolicySnapshot>,
}

impl RuntimeSnapshot {
    pub fn agent(&self, id: &AgentId) -> Result<Arc<AgentDefinition>, AgentError> {
        self.agents
            .get(id)
            .ok_or_else(|| AgentError::AgentNotFound(id.to_string()))
    }

    pub fn resolve_model(
        &self,
        definition: &AgentDefinition,
        caller_model: Option<&ModelProfileId>,
    ) -> Result<Arc<ModelProfile>, AgentError> {
        let id = match &definition.model {
            ModelSelector::RuntimeDefault => &self.default_model,
            ModelSelector::Named(id) => id,
            ModelSelector::InheritCaller => caller_model.unwrap_or(&self.default_model),
        };
        self.models.get(id).ok_or_else(|| {
            AgentError::InvalidConfiguration(format!("model profile '{id}' is not registered"))
        })
    }

    pub fn reachable_agents(&self, caller: &AgentDefinition) -> Vec<Arc<AgentDefinition>> {
        let mut definitions = self
            .agents
            .ids()
            .into_iter()
            .filter(|target| target != &caller.id || self.policy.allow_recursive_calls)
            .filter(|target| caller.callable_agents.allows(target))
            .filter(|target| self.policy.callable_agents.allows(target))
            .filter_map(|target| self.agents.get(&target))
            .collect::<Vec<_>>();
        definitions.sort_by(|left, right| left.id.cmp(&right.id));
        definitions
    }

    pub fn tool_names_for(&self, agent: &AgentDefinition) -> BTreeSet<String> {
        self.tools
            .definitions()
            .into_iter()
            .map(|tool| tool.function.name)
            .filter(|name| name != AGENT_CALL_TOOL_NAME)
            .filter(|name| agent.tools.allows(name) || memory_policy_grants(agent, name))
            .filter(|name| self.policy.tools.allows(name))
            .filter(|name| memory_tool_allowed(agent, name))
            .collect()
    }

    pub fn tool_definitions_for(&self, agent: &AgentDefinition) -> Result<Vec<Tool>, AgentError> {
        let names = self.tool_names_for(agent);
        self.tools
            .definitions_for(names.iter().map(String::as_str))
            .map_err(|error| AgentError::ToolError(error.to_string()))
    }

    pub fn skill_policy_for(&self, agent: &AgentDefinition) -> SkillAccessPolicy {
        intersect_string_policy(&agent.skills, &self.policy.skills, &self.skills.names())
    }
}

fn memory_tool_allowed(agent: &AgentDefinition, name: &str) -> bool {
    use super::types::MemoryPolicy;

    match agent.memory {
        MemoryPolicy::Disabled => name != MEMORY_RECALL_TOOL_NAME && name != MEMORY_STORE_TOOL_NAME,
        MemoryPolicy::ReadOnlyShared => name != MEMORY_STORE_TOOL_NAME,
        MemoryPolicy::ReadWriteShared | MemoryPolicy::PrivateAgent => true,
    }
}

fn memory_policy_grants(agent: &AgentDefinition, name: &str) -> bool {
    use super::types::MemoryPolicy;

    match agent.memory {
        MemoryPolicy::Disabled => false,
        MemoryPolicy::ReadOnlyShared => name == MEMORY_RECALL_TOOL_NAME,
        MemoryPolicy::ReadWriteShared | MemoryPolicy::PrivateAgent => {
            name == MEMORY_RECALL_TOOL_NAME || name == MEMORY_STORE_TOOL_NAME
        }
    }
}

fn intersect_string_policy(
    left: &AccessPolicy<String>,
    right: &AccessPolicy<String>,
    available: &[String],
) -> AccessPolicy<String> {
    AccessPolicy::Allow(
        available
            .iter()
            .filter(|value| left.allows(*value) && right.allows(*value))
            .cloned()
            .collect(),
    )
}

pub(crate) fn validate_snapshot(snapshot: &RuntimeSnapshot) -> Result<(), AgentError> {
    if snapshot.agents.ids().is_empty() {
        return Err(AgentError::InvalidConfiguration(
            "at least one agent must be registered".to_string(),
        ));
    }
    snapshot
        .models
        .get(&snapshot.default_model)
        .ok_or_else(|| {
            AgentError::InvalidConfiguration(format!(
                "default model profile '{}' is not registered",
                snapshot.default_model
            ))
        })?;

    for agent_id in snapshot.agents.ids() {
        let agent = snapshot.agent(&agent_id)?;
        snapshot.resolve_model(&agent, None)?;

        if let Some(tools) = agent.tools.allowed_values() {
            for tool in tools {
                if !snapshot.tools.contains(tool) {
                    return Err(AgentError::InvalidConfiguration(format!(
                        "agent '{}' references unknown tool '{}'",
                        agent.id, tool
                    )));
                }
            }
        }
        if let Some(skills) = agent.skills.allowed_values() {
            for skill in skills {
                if !snapshot.skills.contains(skill) {
                    return Err(AgentError::InvalidConfiguration(format!(
                        "agent '{}' references unknown skill '{}'",
                        agent.id, skill
                    )));
                }
            }
        }
        if let Some(targets) = agent.callable_agents.allowed_values() {
            for target in targets {
                if !snapshot.agents.contains(target) {
                    return Err(AgentError::InvalidConfiguration(format!(
                        "agent '{}' references unknown callable agent '{}'",
                        agent.id, target
                    )));
                }
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use otherone_ai::types::ProviderType;

    use super::*;
    use crate::multi_agent::types::{AgentDefinition, ModelProfile};

    fn profile() -> ModelProfile {
        ModelProfile::builder("default", ProviderType::OpenAI, "model")
            .api_key("key")
            .base_url("http://localhost")
            .build()
            .unwrap()
    }

    #[test]
    fn registry_rejects_duplicate_agents() {
        let definition = AgentDefinition::builder("agent")
            .description("test agent")
            .build()
            .unwrap();
        let mut registry = AgentRegistry::new();
        registry.register(definition.clone()).unwrap();
        assert!(registry.register(definition).is_err());
    }

    #[test]
    fn model_registry_rejects_duplicate_profiles() {
        let mut registry = ModelRegistry::new();
        registry.register(profile()).unwrap();
        assert!(registry.register(profile()).is_err());
    }
}
