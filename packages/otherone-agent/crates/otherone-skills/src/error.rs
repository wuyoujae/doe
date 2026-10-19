// 作用：Skills 系统的错误类型

use thiserror::Error;

#[derive(Error, Debug)]
pub enum SkillError {
    /// 路径不存在
    #[error("Skill path does not exist: {0}")]
    PathNotFound(String),

    /// 文件读取失败
    #[error("Failed to read skill file: {0}")]
    ReadError(#[from] std::io::Error),

    /// 缺少必填的 description
    #[error("Skill missing description: {0}")]
    MissingDescription(String),

    /// 名称验证失败
    #[error("Skill name validation failed: {0}")]
    InvalidName(String),

    /// frontmatter 解析失败
    #[error("Failed to parse frontmatter: {0}")]
    FrontmatterError(String),
}
