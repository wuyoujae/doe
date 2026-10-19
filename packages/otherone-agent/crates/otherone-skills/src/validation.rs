// 作用：Skill 验证 — Agent Skills 标准校验规则
// 关联：被 discovery 和 SkillRegistry 调用
// 预期结果：返回 Ok(()) 或包含具体错误描述的 Err
//
// 参考: Agent Skills standard (https://agentskills.io/specification)

use crate::error::SkillError;

/// 名称最大长度（Agent Skills 标准）
const MAX_NAME_LENGTH: usize = 64;

/// 描述最大长度（Agent Skills 标准）
const MAX_DESCRIPTION_LENGTH: usize = 1024;

/// 验证 Skill 名称
/// 作用：检查名称是否符合 Agent Skills 标准
/// 关联：在加载 Skill 时调用
/// 预期结果：有效返回 Ok，违反规则返回 Err
///
/// 规则:
/// - 最长 64 字符
/// - 只能包含小写 a-z、数字 0-9、连字符 -
/// - 不能以连字符开头或结尾
/// - 不能包含连续连字符 --
pub fn validate_name(name: &str) -> Result<(), SkillError> {
    if name.len() > MAX_NAME_LENGTH {
        return Err(SkillError::InvalidName(format!(
            "name exceeds {} characters ({} chars): '{}'",
            MAX_NAME_LENGTH,
            name.len(),
            name
        )));
    }

    if !name
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Err(SkillError::InvalidName(format!(
            "name contains invalid characters (must be lowercase a-z, 0-9, hyphens only): '{}'",
            name
        )));
    }

    if name.starts_with('-') || name.ends_with('-') {
        return Err(SkillError::InvalidName(format!(
            "name must not start or end with a hyphen: '{}'",
            name
        )));
    }

    if name.contains("--") {
        return Err(SkillError::InvalidName(format!(
            "name must not contain consecutive hyphens: '{}'",
            name
        )));
    }

    Ok(())
}

/// 验证 Skill 描述
/// 作用：检查 description 是否存在且不超长
/// 关联：在加载 Skill 时调用
/// 预期结果：有效返回 Ok，违反规则返回 Err
pub fn validate_description(description: &str) -> Result<(), SkillError> {
    if description.trim().is_empty() {
        return Err(SkillError::MissingDescription(
            "description is required and cannot be empty".to_string(),
        ));
    }

    if description.len() > MAX_DESCRIPTION_LENGTH {
        return Err(SkillError::InvalidName(format!(
            "description exceeds {} characters ({} chars)",
            MAX_DESCRIPTION_LENGTH,
            description.len()
        )));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_name() {
        assert!(validate_name("my-skill").is_ok());
        assert!(validate_name("pdf-tools").is_ok());
        assert!(validate_name("search123").is_ok());
    }

    #[test]
    fn test_name_start_end_hyphen() {
        assert!(validate_name("-bad").is_err());
        assert!(validate_name("bad-").is_err());
    }

    #[test]
    fn test_name_consecutive_hyphens() {
        assert!(validate_name("bad--name").is_err());
    }

    #[test]
    fn test_name_uppercase() {
        assert!(validate_name("BadSkill").is_err());
    }

    #[test]
    fn test_name_too_long() {
        let long = "a".repeat(65);
        assert!(validate_name(&long).is_err());
    }

    #[test]
    fn test_description_empty() {
        assert!(validate_description("").is_err());
        assert!(validate_description("   ").is_err());
    }

    #[test]
    fn test_description_too_long() {
        let long = "a".repeat(1025);
        assert!(validate_description(&long).is_err());
    }

    #[test]
    fn test_description_valid() {
        assert!(validate_description("A useful skill for PDF processing").is_ok());
    }
}
