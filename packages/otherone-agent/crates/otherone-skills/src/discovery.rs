// 作用：Skill 文件发现和解析
// 关联：从文件系统递归扫描 SKILL.md，解析 frontmatter
// 预期结果：遵循 Agent Skills 标准 (https://agentskills.io/specification)
//
// 发现规则:
// - 如果目录包含 SKILL.md，将其作为 Skill 根目录（不递归子目录）
// - 否则，如果是用户/项目目录下直接在根级放 .md 文件，也作为 Skill 发现
// - 递归子目录寻找 SKILL.md
// - 跳过 . 开头的文件和 node_modules
//
// 参考实现: Pi agent (earendil-works/pi) skills.ts

use crate::validation;
use crate::{Skill, SkillFrontmatter};
use std::fs;
use std::path::Path;

/// 解析后的 skill 文件（frontmatter + body）
pub struct ParsedSkillFile {
    pub frontmatter: SkillFrontmatter,
    pub body: String,
}

/// 解析 SKILL.md 文件内容
/// 作用：将 Markdown 文件内容拆分为 YAML frontmatter 和 body
/// 关联：被 load_skill_from_file 调用
/// 预期结果：返回 ParsedSkillFile，包含 frontmatter 和 body
///
/// Frontmatter 格式: ---开头的 YAML 块，以 --- 结束
pub fn parse_skill_file(raw_content: &str) -> ParsedSkillFile {
    let mut frontmatter = SkillFrontmatter::default();
    let body;

    let content = raw_content.trim_start();

    if content.starts_with("---") {
        // 查找第二个 --- 作为 frontmatter 结束标记
        if let Some(end_idx) = content[3..].find("\n---") {
            let fm_raw = &content[3..3 + end_idx].trim();
            body = content[3 + end_idx + 4..].trim().to_string();

            // 简易 YAML 解析: 只解析 key: value 格式
            for line in fm_raw.lines() {
                let line = line.trim();
                if line.is_empty() || line.starts_with('#') {
                    continue;
                }
                if let Some((key, value)) = parse_kv_line(line) {
                    match key {
                        "name" => frontmatter.name = Some(value.to_string()),
                        "description" => frontmatter.description = Some(value.to_string()),
                        "disable-model-invocation" | "disable_model_invocation" => {
                            frontmatter.disable_model_invocation = value == "true";
                        }
                        _ => {} // 忽略未知字段
                    }
                }
            }
        } else {
            // 只有开头的 ---，没有结束标记，当作无 frontmatter
            body = content.to_string();
        }
    } else {
        body = content.to_string();
    }

    ParsedSkillFile { frontmatter, body }
}

/// 解析 "key: value" 行
fn parse_kv_line<'a>(line: &'a str) -> Option<(&'a str, &'a str)> {
    let colon_pos = line.find(':')?;
    let key = line[..colon_pos].trim();
    let value = line[colon_pos + 1..].trim();
    // 去掉引号
    let value = value.trim_matches('"').trim_matches('\'');
    Some((key, value))
}

/// 从目录递归加载 Skill
/// 作用：扫描目录中的 SKILL.md 和 .md 文件
/// 关联：被 SkillRegistry::load_from_dir 调用
/// 预期结果：返回发现的 Skill 列表
///
/// 发现规则:
/// - 优先检查目录中是否有 SKILL.md
/// - 如果有 SKILL.md，整个目录就是一个 Skill（不再递归）
/// - 如果没有 SKILL.md 且 include_root_files=true，根目录下 .md 文件作为独立 Skill
/// - 递归子目录，跳过 . 开头和 node_modules
pub fn load_skills_from_dir(dir: &Path, include_root_files: bool) -> Vec<Skill> {
    let mut skills = Vec::new();

    if !dir.exists() || !dir.is_dir() {
        return skills;
    }

    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return skills,
    };

    let mut subdirs = Vec::new();
    let mut has_skill_md = false;

    // 第一遍：检查是否有 SKILL.md
    for entry in entries.flatten() {
        let file_type = entry.file_type().ok();
        let name = entry.file_name();
        let name_str = name.to_string_lossy();

        if name_str == "SKILL.md" {
            if file_type.map_or(false, |ft| ft.is_file()) {
                if let Some(skill) = load_skill_from_file(&entry.path()) {
                    skills.push(skill);
                    has_skill_md = true;
                }
            }
        }
    }

    // 如果有 SKILL.md，不再递归 — 整个目录就是一个 Skill
    if has_skill_md {
        return skills;
    }

    // 第二遍：处理 .md 文件和子目录
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return skills,
    };

    for entry in entries.flatten() {
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        let path = entry.path();

        // 跳过隐藏文件和 node_modules
        if name_str.starts_with('.') || name_str == "node_modules" {
            continue;
        }

        let file_type = entry.file_type().ok();
        let is_dir = file_type.map_or(false, |ft| ft.is_dir());
        let is_file = file_type.map_or(false, |ft| ft.is_file());

        if is_dir {
            subdirs.push(path);
        } else if is_file && include_root_files && name_str.ends_with(".md") {
            if let Some(skill) = load_skill_from_file(&path) {
                skills.push(skill);
            }
        }
    }

    // 递归子目录
    for subdir in subdirs {
        skills.extend(load_skills_from_dir(&subdir, false));
    }

    skills
}

/// 从单个 .md 文件加载 Skill
/// 作用：解析 SKILL.md 或 .md 文件，提取 name、description
/// 关联：被 load_skills_from_dir 调用
/// 预期结果：验证通过返回 Skill，否则返回 None（并打印 warning）
pub fn load_skill_from_file(file_path: &Path) -> Option<Skill> {
    if !file_path.exists() || !file_path.is_file() {
        return None;
    }

    let raw = match fs::read_to_string(file_path) {
        Ok(r) => r,
        Err(_) => return None,
    };

    let parsed = parse_skill_file(&raw);
    let fm = &parsed.frontmatter;

    // description 是必填的 — 缺少则跳过
    let description = match &fm.description {
        Some(d) if !d.trim().is_empty() => d.clone(),
        _ => {
            tracing::warn!("Skill missing description: {}", file_path.display());
            return None;
        }
    };

    // 验证 description 长度
    if let Err(e) = validation::validate_description(&description) {
        tracing::warn!("{}", e);
        return None;
    }

    // name: 优先用 frontmatter 中的，否则用父目录名或文件名
    let name = match &fm.name {
        Some(n) if !n.trim().is_empty() => n.clone(),
        _ => {
            // 用父目录名（如果是 SKILL.md）或文件名（去掉 .md）
            let file_name = file_path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if file_name == "SKILL.md" {
                file_path
                    .parent()
                    .and_then(|p| p.file_name())
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string()
            } else {
                file_name
                    .strip_suffix(".md")
                    .unwrap_or(file_name)
                    .to_string()
            }
        }
    };

    // 验证 name
    if let Err(e) = validation::validate_name(&name) {
        tracing::warn!("{}", e);
    }

    let base_dir = if file_path.file_name().map_or(false, |n| n == "SKILL.md") {
        file_path.parent().map(|p| p.to_string_lossy().to_string())
    } else {
        Some(
            file_path
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default(),
        )
    };

    Some(Skill {
        name,
        description,
        file_path: file_path.to_string_lossy().to_string(),
        base_dir: base_dir.unwrap_or_default(),
        disable_model_invocation: fm.disable_model_invocation,
        content: None,
    })
}
