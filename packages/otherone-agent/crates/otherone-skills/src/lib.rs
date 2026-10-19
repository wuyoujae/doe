// 作用：Skills 技能系统 — Agent Skills 标准实现
// 关联：Skills 是自包含的 Markdown 文件（SKILL.md），从文件系统发现
// 预期结果：支持多路径自动发现、frontmatter 解析、验证、XML 格式化系统提示
//
// 参考标准: https://agentskills.io/specification
// 参考实现: Pi agent (earendil-works/pi) skills.ts

pub mod discovery;
pub mod error;
pub mod validation;

use serde::Serialize;
use std::path::PathBuf;

/// Skill 的 frontmatter 元数据（YAML 头部）
#[derive(Debug, Clone, Default)]
pub struct SkillFrontmatter {
    /// Skill 名称（小写 a-z、数字、连字符，最长 64）
    pub name: Option<String>,
    /// Skill 描述（必填，最长 1024 字符）
    pub description: Option<String>,
    /// 是否禁止模型自动调用（仅可 /skill:name 手动触发）
    pub disable_model_invocation: bool,
}

/// Skill — 一个完整的技能包
#[derive(Debug, Clone, Serialize)]
pub struct Skill {
    /// Skill 名称
    pub name: String,
    /// Skill 描述
    pub description: String,
    /// SKILL.md 的完整文件路径
    pub file_path: String,
    /// SKILL.md 所在的目录（用于解析相对路径引用）
    pub base_dir: String,
    /// 是否禁用模型自动调用
    pub disable_model_invocation: bool,
    /// SKILL.md 的完整 markdown 内容（按需加载）
    #[serde(skip)]
    pub content: Option<String>,
}

impl Skill {
    /// 从 SKILL.md 文件加载完整内容
    /// 作用：按需加载 Skill 的完整指令和参考文档
    /// 关联：被 AI 调用 read 工具时触发
    /// 预期结果：返回 SKILL.md 的 body 内容（去掉 frontmatter）
    pub fn load_content(&mut self) -> Result<String, std::io::Error> {
        if let Some(ref content) = self.content {
            return Ok(content.clone());
        }
        let raw = std::fs::read_to_string(&self.file_path)?;
        let parsed = discovery::parse_skill_file(&raw);
        let body = parsed.body;
        self.content = Some(body.clone());
        Ok(body)
    }

    /// 获取 content 但不修改 self
    pub fn read_content(&self) -> Result<String, std::io::Error> {
        if let Some(ref content) = self.content {
            return Ok(content.clone());
        }
        let raw = std::fs::read_to_string(&self.file_path)?;
        let parsed = discovery::parse_skill_file(&raw);
        Ok(parsed.body)
    }
}

/// Skills 加载配置
#[derive(Debug, Clone)]
pub struct SkillsConfig {
    /// 是否加载默认路径（~/.otherone/skills/ 和 .otherone/skills/）
    pub include_defaults: bool,
    /// 用户全局 skills 目录
    pub user_skills_dir: Option<PathBuf>,
    /// 项目本地 skills 目录
    pub project_skills_dir: Option<PathBuf>,
    /// 显式指定的额外 skill 路径（文件或目录）
    pub extra_paths: Vec<PathBuf>,
    /// 当前工作目录
    pub cwd: PathBuf,
}

impl Default for SkillsConfig {
    fn default() -> Self {
        let home = dirs().unwrap_or_else(|| PathBuf::from("."));
        SkillsConfig {
            include_defaults: true,
            user_skills_dir: Some(home.join(".otherone").join("skills")),
            project_skills_dir: Some(PathBuf::from(".otherone").join("skills")),
            extra_paths: Vec::new(),
            cwd: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
        }
    }
}

fn dirs() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var("USERPROFILE").ok().map(PathBuf::from)
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::env::var("HOME").ok().map(PathBuf::from)
    }
}

/// Skills 注册表
/// 作用：管理从文件系统发现的所有 Skill
/// 关联：在 Agent 初始化时调用 load_from_config 加载所有 Skill
/// 预期结果：提供 Skill 查询、格式化系统提示、内容加载等功能
pub struct SkillRegistry {
    skills: Vec<Skill>,
}

impl SkillRegistry {
    /// 创建空的注册表
    pub fn new() -> Self {
        SkillRegistry { skills: Vec::new() }
    }

    /// 从 SkillsConfig 加载所有 Skill
    /// 作用：按配置扫描多个路径，发现 SKILL.md 文件
    /// 关联：Agent 初始化时调用
    /// 预期结果：返回所有发现并解析的 Skill 数组
    pub fn load_from_config(config: &SkillsConfig) -> Result<Self, error::SkillError> {
        let mut registry = SkillRegistry::new();

        if config.include_defaults {
            if let Some(ref user_dir) = config.user_skills_dir {
                let _ = registry.load_from_dir(user_dir, true);
            }
            if let Some(ref project_dir) = config.project_skills_dir {
                let project_path = config.cwd.join(project_dir);
                let _ = registry.load_from_dir(&project_path, true);
            }
        }

        for extra_path in &config.extra_paths {
            if extra_path.is_dir() {
                let _ = registry.load_from_dir(extra_path, true);
            } else if extra_path.is_file() && extra_path.extension().map_or(false, |e| e == "md") {
                registry.load_from_file(extra_path);
            }
        }

        // 去重：同名 Skill 保留第一个
        registry.dedup();

        Ok(registry)
    }

    /// 从目录递归扫描加载
    pub fn load_from_dir(&mut self, dir: &PathBuf, include_root_files: bool) -> usize {
        let result = discovery::load_skills_from_dir(dir, include_root_files);
        let count = result.len();
        self.skills.extend(result);
        count
    }

    /// 加载单个 SKILL.md 文件
    pub fn load_from_file(&mut self, file_path: &PathBuf) -> bool {
        match discovery::load_skill_from_file(file_path) {
            Some(skill) => {
                self.skills.push(skill);
                true
            }
            None => false,
        }
    }

    /// 按名称查找
    pub fn get(&self, name: &str) -> Option<&Skill> {
        self.skills.iter().find(|s| s.name == name)
    }

    /// 获取所有 Skill
    pub fn get_all(&self) -> &[Skill] {
        &self.skills
    }

    /// 获取可被模型调用的 Skill（排除 disable_model_invocation）
    pub fn get_visible(&self) -> Vec<&Skill> {
        self.skills
            .iter()
            .filter(|s| !s.disable_model_invocation)
            .collect()
    }

    /// 格式化 Skills 为系统提示 XML
    /// 作用：生成符合 Agent Skills 标准的 XML 块，注入到 system prompt 中
    /// 关联：被 combine_context 调用
    /// 预期结果：返回 <available_skills> XML 字符串
    ///
    /// 参考: https://agentskills.io/integrate-skills
    pub fn format_for_prompt(&self) -> String {
        let visible = self.get_visible();
        if visible.is_empty() {
            return String::new();
        }

        let mut lines = vec![
            String::new(),
            "The following skills provide specialized instructions for specific tasks.".to_string(),
            "Use the read tool to load a skill's file when the task matches its description.".to_string(),
            "When a skill file references a relative path, resolve it against the skill directory (parent of SKILL.md / dirname of the path) and use that absolute path in tool commands.".into(),
            String::new(),
            "<available_skills>".to_string(),
        ];

        for skill in &visible {
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

    fn dedup(&mut self) {
        let mut seen = std::collections::HashSet::new();
        let mut deduped = Vec::new();
        for skill in self.skills.drain(..) {
            if seen.insert(skill.name.clone()) {
                deduped.push(skill);
            }
        }
        self.skills = deduped;
    }

    pub fn len(&self) -> usize {
        self.skills.len()
    }
    pub fn is_empty(&self) -> bool {
        self.skills.is_empty()
    }
}

impl Default for SkillRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// XML 转义
fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}
