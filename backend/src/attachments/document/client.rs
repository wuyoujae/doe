use super::error::{ParseError, ParseErrorCode};
use super::types::{ParsedDocument, ParserDocumentData, ParserResponse};
use super::validation::{MAX_CONTENT_CHARS, ValidatedDocument, validate_document};
use reqwest::multipart::{Form, Part};
use sha2::{Digest, Sha256};
use std::env;
use std::time::{Duration, Instant};

const DEFAULT_PARSER_URL: &str = "http://127.0.0.1:7765";
const DEFAULT_TIMEOUT_SECONDS: u64 = 300;
const MAX_TIMEOUT_SECONDS: u64 = 600;
const MAX_UPSTREAM_RESPONSE_BYTES: usize = 16 * 1024 * 1024;
const MAX_WARNING_COUNT: usize = 50;
const MAX_WARNING_BYTES: usize = 1_000;
const MAX_RETRY_DELAY_SECONDS: u64 = 15;
// This namespace intentionally cannot inherit the commercial parser URL or token.
const PRIMARY_ENV_PREFIX: &str = "YRKIE_LOCAL_FILE_PARSER_";

#[derive(Debug, Clone)]
struct FileParserConfig {
    endpoint: reqwest::Url,
    token: String,
    timeout: Duration,
}

impl FileParserConfig {
    fn from_env() -> Result<Self, ParseError> {
        if parser_env_text("ENABLED").is_some() && !parser_env_flag("ENABLED")? {
            return Err(configuration_error("文档解析功能当前未启用"));
        }

        let base_url = parser_env_text("URL").unwrap_or_else(|| DEFAULT_PARSER_URL.to_string());
        let endpoint_text = format!("{}/v1/documents/parse", base_url.trim_end_matches('/'));
        let endpoint = reqwest::Url::parse(&endpoint_text)
            .map_err(|_| configuration_error("文档解析服务地址配置无效"))?;
        if !matches!(endpoint.scheme(), "http" | "https")
            || !matches!(endpoint.host_str(), Some("127.0.0.1" | "localhost"))
            || !endpoint.username().is_empty()
            || endpoint.password().is_some()
            || endpoint.query().is_some()
            || endpoint.fragment().is_some()
        {
            return Err(configuration_error("文档解析服务地址配置无效"));
        }

        let token = parser_env_text("TOKEN")
            .or_else(|| {
                let root = env::var_os("YRKIE_DATA_DIR")
                    .map(std::path::PathBuf::from)
                    .unwrap_or_else(|| std::path::PathBuf::from(".run-data/backend"));
                std::fs::read_to_string(root.join("parser-token"))
                    .ok()
                    .map(|v| v.trim().to_owned())
            })
            .filter(|value| {
                !value.is_empty() && value.len() <= 4_096 && !value.chars().any(char::is_control)
            })
            .ok_or_else(|| configuration_error("文档解析服务凭据尚未配置"))?;
        let timeout_seconds = match parser_env_text("TIMEOUT_SECONDS") {
            Some(value) => value
                .parse::<u64>()
                .ok()
                .filter(|value| (1..=MAX_TIMEOUT_SECONDS).contains(value))
                .ok_or_else(|| configuration_error("文档解析超时配置无效"))?,
            None => DEFAULT_TIMEOUT_SECONDS,
        };

        Ok(Self {
            endpoint,
            token,
            timeout: Duration::from_secs(timeout_seconds),
        })
    }
}

pub(crate) async fn parse_document_with_client(
    request: super::types::ParseDocumentRequest,
) -> Result<ParsedDocument, ParseError> {
    let document = validate_document(request)?;
    let config = FileParserConfig::from_env()?;
    let request_id = generate_request_id();
    let detected_type = document.detected_type;
    let size_bytes = document.bytes.len();
    let started_at = Instant::now();

    let deadline = Instant::now() + config.timeout;
    let mut retry_attempt = 0_u32;
    let result = loop {
        let remaining = deadline.saturating_duration_since(Instant::now());
        if remaining.is_zero() {
            break Err(ParseError::new(ParseErrorCode::ParserTimeout));
        }

        match send_document(&config, &document, &request_id, remaining).await {
            Err(error) if should_retry_parser_error(&error) => {
                let delay = retry_delay(retry_attempt);
                if delay >= deadline.saturating_duration_since(Instant::now()) {
                    break Err(ParseError::new(ParseErrorCode::ParserTimeout));
                }
                eprintln!(
                    "[file_parser] request_id={} status=retry code={} attempt={} delay_ms={}",
                    request_id,
                    error.code.as_str(),
                    retry_attempt + 1,
                    delay.as_millis()
                );
                tokio::time::sleep(delay).await;
                retry_attempt = retry_attempt.saturating_add(1);
            }
            result => break result,
        }
    };
    match &result {
        Ok(_) => eprintln!(
            "[file_parser] request_id={} type={} size_bytes={} status=success duration_ms={}",
            request_id,
            detected_type,
            size_bytes,
            started_at.elapsed().as_millis()
        ),
        Err(error) => eprintln!(
            "[file_parser] request_id={} type={} size_bytes={} status=error code={} duration_ms={}",
            request_id,
            detected_type,
            size_bytes,
            error.code.as_str(),
            started_at.elapsed().as_millis()
        ),
    }
    result.map_err(|error| {
        if error.request_id.is_none() {
            error.with_request_id(Some(request_id))
        } else {
            error
        }
    })
}

async fn send_document(
    config: &FileParserConfig,
    document: &ValidatedDocument,
    request_id: &str,
    request_timeout: Duration,
) -> Result<ParsedDocument, ParseError> {
    let original_name = document.original_name.clone();
    let detected_type = document.detected_type;
    let canonical_mime_type = document.canonical_mime_type;
    let size_bytes = document.bytes.len() as u64;
    let expected_sha256 = sha256_hex(&document.bytes);
    let upload_mime_type = document
        .declared_mime_type
        .as_deref()
        .unwrap_or(document.canonical_mime_type);
    let part = Part::bytes(document.bytes.clone())
        .file_name(original_name.clone())
        .mime_str(upload_mime_type)
        .map_err(|_| ParseError::new(ParseErrorCode::InvalidRequest))?;
    let form = Form::new()
        .part("file", part)
        .text("request_id", request_id.to_string());
    let client = reqwest::Client::builder()
        .connect_timeout(request_timeout.min(Duration::from_secs(15)))
        .timeout(request_timeout)
        .build()
        .map_err(|_| ParseError::new(ParseErrorCode::ParserUnavailable))?;
    let mut response = client
        .post(config.endpoint.clone())
        .bearer_auth(&config.token)
        .multipart(form)
        .send()
        .await
        .map_err(map_transport_error)?;
    let status = response.status();
    if matches!(status.as_u16(), 401 | 403) {
        return Err(configuration_error("文档解析服务鉴权配置无效"));
    }
    if response
        .content_length()
        .is_some_and(|length| length > MAX_UPSTREAM_RESPONSE_BYTES as u64)
    {
        return Err(ParseError::new(ParseErrorCode::ContentTooLarge));
    }

    let mut body = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(map_transport_error)? {
        if body.len().saturating_add(chunk.len()) > MAX_UPSTREAM_RESPONSE_BYTES {
            return Err(ParseError::new(ParseErrorCode::ContentTooLarge));
        }
        body.extend_from_slice(&chunk);
    }

    let parser_response = serde_json::from_slice::<ParserResponse>(&body).map_err(|_| {
        fallback_status_error(status.as_u16())
            .unwrap_or_else(|| ParseError::new(ParseErrorCode::ParserFailed))
    })?;
    match parser_response {
        ParserResponse::Error { error } => Err(ParseError::from_upstream(
            &error.code,
            error.retryable,
            error.request_id,
        )),
        ParserResponse::Success { data } if status.is_success() => validate_parser_document(
            data,
            &original_name,
            detected_type,
            canonical_mime_type,
            size_bytes,
            &expected_sha256,
        ),
        ParserResponse::Success { .. } => Err(fallback_status_error(status.as_u16())
            .unwrap_or_else(|| ParseError::new(ParseErrorCode::ParserFailed))),
    }
}

fn should_retry_parser_error(error: &ParseError) -> bool {
    error.retryable
        && matches!(
            error.code,
            ParseErrorCode::ParserBusy
                | ParseErrorCode::ParserNotReady
                | ParseErrorCode::ParserUnavailable
        )
}

fn retry_delay(attempt: u32) -> Duration {
    let exponent = attempt.min(4);
    Duration::from_secs((1_u64 << exponent).min(MAX_RETRY_DELAY_SECONDS))
}

fn validate_parser_document(
    data: ParserDocumentData,
    original_name: &str,
    detected_type: &str,
    canonical_mime_type: &str,
    size_bytes: u64,
    expected_sha256: &str,
) -> Result<ParsedDocument, ParseError> {
    let content_chars = data.markdown.chars().count();
    let response_is_invalid = data.kind != "document"
        || data.original_name != original_name
        || data.detected_type != detected_type
        || data.mime_type != canonical_mime_type
        || data.size_bytes != size_bytes
        || !data.sha256.eq_ignore_ascii_case(expected_sha256)
        || data.content_chars != content_chars as u64
        || data.estimated_tokens == 0
        || data.estimated_tokens > content_chars as u64
        || data.markdown.trim().is_empty()
        || content_chars > MAX_CONTENT_CHARS
        || data.warnings.len() > MAX_WARNING_COUNT
        || data
            .warnings
            .iter()
            .any(|warning| warning.len() > MAX_WARNING_BYTES);
    if response_is_invalid {
        return Err(ParseError::new(ParseErrorCode::ParserFailed));
    }

    Ok(ParsedDocument {
        kind: "document".to_string(),
        original_name: original_name.to_string(),
        detected_type: detected_type.to_string(),
        mime_type: canonical_mime_type.to_string(),
        size_bytes,
        sha256: expected_sha256.to_string(),
        markdown: data.markdown,
        content_chars: content_chars as u64,
        estimated_tokens: data.estimated_tokens,
        warnings: data.warnings,
        duration_ms: data.duration_ms,
    })
}

fn map_transport_error(error: reqwest::Error) -> ParseError {
    if error.is_timeout() {
        ParseError::new(ParseErrorCode::ParserTimeout)
    } else {
        ParseError::new(ParseErrorCode::ParserUnavailable)
    }
}

fn fallback_status_error(status: u16) -> Option<ParseError> {
    let code = match status {
        400 => ParseErrorCode::InvalidRequest,
        413 => ParseErrorCode::FileTooLarge,
        415 => ParseErrorCode::UnsupportedType,
        422 => ParseErrorCode::CorruptDocument,
        429 => ParseErrorCode::ParserBusy,
        501 => ParseErrorCode::NotImplemented,
        503 => ParseErrorCode::ParserNotReady,
        504 => ParseErrorCode::ParserTimeout,
        401 | 403 => {
            let mut error = configuration_error("文档解析服务鉴权配置无效");
            error.request_id = None;
            return Some(error);
        }
        500..=599 => ParseErrorCode::ParserFailed,
        _ => return None,
    };
    Some(ParseError::new(code))
}

fn configuration_error(message: &str) -> ParseError {
    ParseError {
        code: ParseErrorCode::ParserUnavailable,
        message: message.to_string(),
        retryable: false,
        request_id: None,
    }
}

fn env_text(name: &str) -> Option<String> {
    env::var(name)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn parser_env_text(suffix: &str) -> Option<String> {
    env_text(&format!("{PRIMARY_ENV_PREFIX}{suffix}"))
}

fn parser_env_flag(suffix: &str) -> Result<bool, ParseError> {
    match parser_env_text(suffix).as_deref() {
        None | Some("0" | "false" | "FALSE" | "no" | "NO") => Ok(false),
        Some("1" | "true" | "TRUE" | "yes" | "YES") => Ok(true),
        Some(_) => Err(configuration_error("文档解析功能开关配置无效")),
    }
}

fn sha256_hex(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn generate_request_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid_data(markdown: &str) -> ParserDocumentData {
        let input = b"%PDF-1.7";
        ParserDocumentData {
            kind: "document".to_string(),
            original_name: "demo.pdf".to_string(),
            detected_type: "pdf".to_string(),
            mime_type: "application/pdf".to_string(),
            size_bytes: input.len() as u64,
            sha256: sha256_hex(input),
            markdown: markdown.to_string(),
            content_chars: markdown.chars().count() as u64,
            estimated_tokens: 3,
            warnings: vec![],
            duration_ms: 12,
        }
    }

    #[test]
    fn validates_successful_upstream_contract() {
        let input = b"%PDF-1.7";
        let parsed = validate_parser_document(
            valid_data("# 标题"),
            "demo.pdf",
            "pdf",
            "application/pdf",
            input.len() as u64,
            &sha256_hex(input),
        )
        .expect("valid parser response");

        assert_eq!(parsed.markdown, "# 标题");
        assert_eq!(parsed.original_name, "demo.pdf");
    }

    #[test]
    fn rejects_mismatched_or_empty_upstream_content() {
        let input = b"%PDF-1.7";
        let mut data = valid_data("");
        data.sha256 = "0".repeat(64);
        let error = validate_parser_document(
            data,
            "demo.pdf",
            "pdf",
            "application/pdf",
            input.len() as u64,
            &sha256_hex(input),
        )
        .expect_err("invalid parser response");

        assert_eq!(error.code, ParseErrorCode::ParserFailed);
    }

    #[test]
    fn rejects_an_impossible_estimated_token_upper_bound() {
        let input = b"%PDF-1.7";
        let mut data = valid_data("short");
        data.estimated_tokens = 6;
        let error = validate_parser_document(
            data,
            "demo.pdf",
            "pdf",
            "application/pdf",
            input.len() as u64,
            &sha256_hex(input),
        )
        .expect_err("token estimate cannot exceed character count");

        assert_eq!(error.code, ParseErrorCode::ParserFailed);
    }

    #[test]
    fn parser_auth_status_is_a_non_retryable_configuration_error() {
        for status in [401, 403] {
            let error = fallback_status_error(status).expect("mapped auth status");
            assert_eq!(error.code, ParseErrorCode::ParserUnavailable);
            assert!(!error.retryable);
        }
    }

    #[test]
    fn retries_only_transient_parser_availability_errors() {
        for code in [
            ParseErrorCode::ParserBusy,
            ParseErrorCode::ParserNotReady,
            ParseErrorCode::ParserUnavailable,
        ] {
            assert!(should_retry_parser_error(&ParseError::new(code)));
        }

        assert!(!should_retry_parser_error(&ParseError::new(
            ParseErrorCode::ParserTimeout
        )));
        assert!(!should_retry_parser_error(&configuration_error(
            "invalid parser authentication"
        )));
    }

    #[test]
    fn parser_retry_delay_is_bounded() {
        let delays: Vec<u64> = (0..7)
            .map(|attempt| retry_delay(attempt).as_secs())
            .collect();

        assert_eq!(delays, vec![1, 2, 4, 8, 15, 15, 15]);
    }
}
