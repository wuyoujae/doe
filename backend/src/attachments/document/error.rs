use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ParseErrorCode {
    InvalidRequest,
    FileTooLarge,
    UnsupportedType,
    TypeMismatch,
    EmptyFile,
    CorruptDocument,
    PasswordProtected,
    EmptyContent,
    TooManyPages,
    ContentTooLarge,
    ParserBusy,
    NotImplemented,
    ParserNotReady,
    ParserUnavailable,
    ParserTimeout,
    ParserFailed,
}

impl ParseErrorCode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::InvalidRequest => "INVALID_REQUEST",
            Self::FileTooLarge => "FILE_TOO_LARGE",
            Self::UnsupportedType => "UNSUPPORTED_TYPE",
            Self::TypeMismatch => "TYPE_MISMATCH",
            Self::EmptyFile => "EMPTY_FILE",
            Self::CorruptDocument => "CORRUPT_DOCUMENT",
            Self::PasswordProtected => "PASSWORD_PROTECTED",
            Self::EmptyContent => "EMPTY_CONTENT",
            Self::TooManyPages => "TOO_MANY_PAGES",
            Self::ContentTooLarge => "CONTENT_TOO_LARGE",
            Self::ParserBusy => "PARSER_BUSY",
            Self::NotImplemented => "NOT_IMPLEMENTED",
            Self::ParserNotReady => "PARSER_NOT_READY",
            Self::ParserUnavailable => "PARSER_UNAVAILABLE",
            Self::ParserTimeout => "PARSER_TIMEOUT",
            Self::ParserFailed => "PARSER_FAILED",
        }
    }

    pub fn from_upstream(value: &str) -> Self {
        match value {
            "INVALID_REQUEST" => Self::InvalidRequest,
            "FILE_TOO_LARGE" => Self::FileTooLarge,
            "UNSUPPORTED_TYPE" => Self::UnsupportedType,
            "TYPE_MISMATCH" => Self::TypeMismatch,
            "EMPTY_FILE" => Self::EmptyFile,
            "CORRUPT_DOCUMENT" => Self::CorruptDocument,
            "PASSWORD_PROTECTED" => Self::PasswordProtected,
            "EMPTY_CONTENT" => Self::EmptyContent,
            "TOO_MANY_PAGES" => Self::TooManyPages,
            "CONTENT_TOO_LARGE" => Self::ContentTooLarge,
            "PARSER_BUSY" => Self::ParserBusy,
            "NOT_IMPLEMENTED" => Self::NotImplemented,
            "PARSER_NOT_READY" => Self::ParserNotReady,
            "PARSER_UNAVAILABLE" => Self::ParserUnavailable,
            "PARSER_TIMEOUT" => Self::ParserTimeout,
            _ => Self::ParserFailed,
        }
    }

    pub fn retryable(self) -> bool {
        matches!(
            self,
            Self::ParserBusy
                | Self::ParserNotReady
                | Self::ParserUnavailable
                | Self::ParserTimeout
                | Self::ParserFailed
        )
    }

    pub fn http_status(self) -> u16 {
        match self {
            Self::InvalidRequest => 400,
            Self::FileTooLarge => 413,
            Self::UnsupportedType | Self::TypeMismatch => 415,
            Self::EmptyFile
            | Self::CorruptDocument
            | Self::PasswordProtected
            | Self::EmptyContent
            | Self::TooManyPages
            | Self::ContentTooLarge => 422,
            Self::ParserBusy => 429,
            Self::NotImplemented => 501,
            Self::ParserNotReady | Self::ParserUnavailable => 503,
            Self::ParserTimeout => 504,
            Self::ParserFailed => 500,
        }
    }

    fn safe_message(self) -> &'static str {
        match self {
            Self::InvalidRequest => "附件请求无效，请重新选择文件",
            Self::FileTooLarge => "文件大小超过 30 MiB 限制",
            Self::UnsupportedType => "暂不支持这种文档格式",
            Self::TypeMismatch => "文件内容与扩展名或类型不匹配",
            Self::EmptyFile => "文件为空，无法解析",
            Self::CorruptDocument => "文档已损坏或结构无效",
            Self::PasswordProtected => "文档受密码保护，暂时无法解析",
            Self::EmptyContent => "文档中没有可解析的有效内容",
            Self::TooManyPages => "文档页数超过限制，请拆分后重试",
            Self::ContentTooLarge => "文档解析后的正文过长，请拆分后重试",
            Self::ParserBusy => "文档解析服务繁忙，请稍后重试",
            Self::NotImplemented => "该附件类型的解析能力尚未实现",
            Self::ParserNotReady => "文档解析服务尚未就绪，请稍后重试",
            Self::ParserUnavailable => "文档解析服务当前不可用，请稍后重试",
            Self::ParserTimeout => "文档解析超时，请重试或拆分文档",
            Self::ParserFailed => "文档解析失败，请重试",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParseError {
    pub code: ParseErrorCode,
    pub message: String,
    pub retryable: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
}

impl ParseError {
    pub fn new(code: ParseErrorCode) -> Self {
        Self {
            code,
            message: code.safe_message().to_string(),
            retryable: code.retryable(),
            request_id: None,
        }
    }

    pub fn with_request_id(mut self, request_id: Option<String>) -> Self {
        self.request_id = request_id.filter(|value| !value.trim().is_empty());
        self
    }

    pub(crate) fn from_upstream(
        code: &str,
        upstream_retryable: bool,
        request_id: Option<String>,
    ) -> Self {
        let code = ParseErrorCode::from_upstream(code);
        let mut error = Self::new(code).with_request_id(request_id);
        if code == ParseErrorCode::ParserFailed {
            error.retryable = upstream_retryable;
        }
        error
    }
}

impl fmt::Display for ParseError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.message)
    }
}

impl std::error::Error for ParseError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unknown_upstream_errors_are_safely_normalized() {
        let error =
            ParseError::from_upstream("INTERNAL_TRACEBACK", false, Some("request-1".to_string()));

        assert_eq!(error.code, ParseErrorCode::ParserFailed);
        assert_eq!(error.message, "文档解析失败，请重试");
        assert!(!error.retryable);
        assert_eq!(error.request_id.as_deref(), Some("request-1"));
    }
}
