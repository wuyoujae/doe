use super::error::{ParseError, ParseErrorCode};
use super::types::ParseDocumentRequest;

pub const MAX_FILE_BYTES: usize = 30 * 1024 * 1024;
pub const MAX_CONTENT_CHARS: usize = 2_000_000;
pub const MAX_FILENAME_CHARS: usize = 255;
pub const MAX_FILENAME_BYTES: usize = 1_024;

const MAX_MIME_BYTES: usize = 255;

#[derive(Debug)]
pub(crate) struct ValidatedDocument {
    pub original_name: String,
    pub declared_mime_type: Option<String>,
    pub bytes: Vec<u8>,
    pub detected_type: &'static str,
    pub canonical_mime_type: &'static str,
}

#[derive(Debug, Clone, Copy)]
struct FormatRule {
    detected_type: &'static str,
    canonical_mime_type: &'static str,
    allowed_mime_types: &'static [&'static str],
    content_kind: ContentKind,
}

#[derive(Debug, Clone, Copy)]
enum ContentKind {
    Pdf,
    Ooxml,
    Utf8,
    Json,
}

pub(crate) fn validate_document(
    request: ParseDocumentRequest,
) -> Result<ValidatedDocument, ParseError> {
    let original_name = validate_filename(&request.original_name)?;
    if request.bytes.is_empty() {
        return Err(ParseError::new(ParseErrorCode::EmptyFile));
    }
    if request.bytes.len() > MAX_FILE_BYTES {
        return Err(ParseError::new(ParseErrorCode::FileTooLarge));
    }

    let extension = original_name
        .rsplit_once('.')
        .map(|(_, extension)| extension.to_ascii_lowercase())
        .filter(|extension| !extension.is_empty())
        .ok_or_else(|| ParseError::new(ParseErrorCode::UnsupportedType))?;
    let rule =
        format_rule(&extension).ok_or_else(|| ParseError::new(ParseErrorCode::UnsupportedType))?;
    let declared_mime_type = normalize_mime_type(request.declared_mime_type)?;

    if let Some(mime_type) = declared_mime_type.as_deref() {
        if !matches!(
            mime_type,
            "application/octet-stream" | "binary/octet-stream"
        ) && !rule.allowed_mime_types.contains(&mime_type)
        {
            return Err(ParseError::new(ParseErrorCode::TypeMismatch));
        }
    }

    validate_content(rule.content_kind, &request.bytes)?;

    Ok(ValidatedDocument {
        original_name,
        declared_mime_type,
        bytes: request.bytes,
        detected_type: rule.detected_type,
        canonical_mime_type: rule.canonical_mime_type,
    })
}

fn validate_filename(value: &str) -> Result<String, ParseError> {
    let value = value.trim();
    if value.is_empty()
        || value.chars().count() > MAX_FILENAME_CHARS
        || value.len() > MAX_FILENAME_BYTES
        || value == "."
        || value == ".."
        || value
            .chars()
            .any(|character| character.is_control() || matches!(character, '/' | '\\'))
    {
        return Err(ParseError::new(ParseErrorCode::InvalidRequest));
    }

    Ok(value.to_string())
}

fn normalize_mime_type(value: Option<String>) -> Result<Option<String>, ParseError> {
    let Some(value) = value else {
        return Ok(None);
    };
    let value = value.trim();
    if value.is_empty() {
        return Ok(None);
    }
    if value.len() > MAX_MIME_BYTES || value.chars().any(char::is_control) {
        return Err(ParseError::new(ParseErrorCode::InvalidRequest));
    }

    let essence = value
        .split(';')
        .next()
        .unwrap_or_default()
        .trim()
        .to_ascii_lowercase();
    if essence.is_empty() || !essence.contains('/') {
        return Err(ParseError::new(ParseErrorCode::InvalidRequest));
    }

    Ok(Some(essence))
}

fn format_rule(extension: &str) -> Option<FormatRule> {
    match extension {
        "pdf" => Some(FormatRule {
            detected_type: "pdf",
            canonical_mime_type: "application/pdf",
            allowed_mime_types: &["application/pdf"],
            content_kind: ContentKind::Pdf,
        }),
        "docx" => Some(FormatRule {
            detected_type: "docx",
            canonical_mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            allowed_mime_types: &[
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/msword",
                "application/zip",
            ],
            content_kind: ContentKind::Ooxml,
        }),
        "pptx" => Some(FormatRule {
            detected_type: "pptx",
            canonical_mime_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            allowed_mime_types: &[
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "application/vnd.ms-powerpoint",
                "application/zip",
            ],
            content_kind: ContentKind::Ooxml,
        }),
        "xlsx" => Some(FormatRule {
            detected_type: "xlsx",
            canonical_mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            allowed_mime_types: &[
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "application/zip",
            ],
            content_kind: ContentKind::Ooxml,
        }),
        "html" | "htm" => Some(FormatRule {
            detected_type: "html",
            canonical_mime_type: "text/html",
            allowed_mime_types: &["text/html", "application/xhtml+xml", "text/plain"],
            content_kind: ContentKind::Utf8,
        }),
        "md" => Some(FormatRule {
            detected_type: "md",
            canonical_mime_type: "text/markdown",
            allowed_mime_types: &["text/markdown", "text/x-markdown", "text/plain"],
            content_kind: ContentKind::Utf8,
        }),
        "csv" => Some(FormatRule {
            detected_type: "csv",
            canonical_mime_type: "text/csv",
            allowed_mime_types: &[
                "text/csv",
                "application/csv",
                "application/vnd.ms-excel",
                "text/plain",
            ],
            content_kind: ContentKind::Utf8,
        }),
        "txt" => Some(FormatRule {
            detected_type: "txt",
            canonical_mime_type: "text/plain",
            allowed_mime_types: &["text/plain"],
            content_kind: ContentKind::Utf8,
        }),
        "json" => Some(FormatRule {
            detected_type: "json",
            canonical_mime_type: "application/json",
            allowed_mime_types: &["application/json", "text/json", "text/plain"],
            content_kind: ContentKind::Json,
        }),
        _ => None,
    }
}

fn validate_content(kind: ContentKind, bytes: &[u8]) -> Result<(), ParseError> {
    match kind {
        ContentKind::Pdf => {
            let header = &bytes[..bytes.len().min(1024)];
            if !header.windows(5).any(|window| window == b"%PDF-") {
                return Err(ParseError::new(ParseErrorCode::TypeMismatch));
            }
        }
        ContentKind::Ooxml => {
            if bytes.len() < 4
                || !matches!(
                    &bytes[..4],
                    [b'P', b'K', 3, 4] | [b'P', b'K', 5, 6] | [b'P', b'K', 7, 8]
                )
            {
                return Err(ParseError::new(ParseErrorCode::TypeMismatch));
            }
        }
        ContentKind::Utf8 => {
            utf8_text(bytes)?;
        }
        ContentKind::Json => {
            let text = utf8_text(bytes)?;
            serde_json::from_str::<serde_json::Value>(text)
                .map_err(|_| ParseError::new(ParseErrorCode::CorruptDocument))?;
        }
    }

    Ok(())
}

fn utf8_text(bytes: &[u8]) -> Result<&str, ParseError> {
    let bytes = bytes.strip_prefix(&[0xEF, 0xBB, 0xBF]).unwrap_or(bytes);
    std::str::from_utf8(bytes).map_err(|_| ParseError::new(ParseErrorCode::TypeMismatch))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request(name: &str, mime: Option<&str>, bytes: &[u8]) -> ParseDocumentRequest {
        ParseDocumentRequest {
            original_name: name.to_string(),
            declared_mime_type: mime.map(ToString::to_string),
            bytes: bytes.to_vec(),
        }
    }

    #[test]
    fn accepts_utf8_text_and_empty_browser_mime() {
        let document = validate_document(request("说明.md", None, "# 标题".as_bytes()))
            .expect("valid markdown");

        assert_eq!(document.detected_type, "md");
        assert_eq!(document.canonical_mime_type, "text/markdown");
    }

    #[test]
    fn accepts_browser_mime_aliases_used_by_the_python_parser() {
        for (name, mime) in [
            ("demo.docx", "application/msword"),
            ("demo.pptx", "application/vnd.ms-powerpoint"),
            ("demo.xlsx", "application/vnd.ms-excel"),
        ] {
            validate_document(request(name, Some(mime), b"PK\x03\x04"))
                .expect("legacy Office declaration must be accepted for valid OOXML");
        }

        validate_document(request("demo.md", Some("text/x-markdown"), b"# heading"))
            .expect("text/x-markdown must be accepted");
        validate_document(request("demo.html", Some("text/plain"), b"<p>content</p>"))
            .expect("browser text/plain HTML declaration must be accepted");
        validate_document(request(
            "demo.pdf",
            Some("binary/octet-stream"),
            b"%PDF-1.7",
        ))
        .expect("generic binary MIME must be accepted after content validation");
    }

    #[test]
    fn filename_limit_counts_unicode_characters_and_utf8_bytes() {
        let name = format!("{}.pdf", "文".repeat(251));
        validate_document(request(&name, None, b"%PDF-1.7"))
            .expect("255-character Unicode filename must be accepted");

        let too_many_characters = format!("{}.pdf", "文".repeat(252));
        let error = validate_document(request(&too_many_characters, None, b"%PDF-1.7"))
            .expect_err("256-character filename must be rejected");
        assert_eq!(error.code, ParseErrorCode::InvalidRequest);
    }

    #[test]
    fn rejects_legacy_office_and_path_filenames() {
        let legacy = validate_document(request("old.doc", None, b"legacy"))
            .expect_err("legacy office must be rejected");
        assert_eq!(legacy.code, ParseErrorCode::UnsupportedType);

        let path = validate_document(request("../secret.pdf", None, b"%PDF-1.7"))
            .expect_err("paths must be rejected");
        assert_eq!(path.code, ParseErrorCode::InvalidRequest);
    }

    #[test]
    fn rejects_extension_mime_and_magic_mismatches() {
        let mime = validate_document(request("demo.pdf", Some("image/png"), b"%PDF-1.7"))
            .expect_err("wrong mime must be rejected");
        assert_eq!(mime.code, ParseErrorCode::TypeMismatch);

        let magic = validate_document(request(
            "demo.docx",
            Some("application/octet-stream"),
            b"not-a-zip",
        ))
        .expect_err("wrong magic must be rejected");
        assert_eq!(magic.code, ParseErrorCode::TypeMismatch);
    }

    #[test]
    fn validates_json_before_forwarding() {
        let error = validate_document(request("demo.json", None, b"{broken"))
            .expect_err("invalid json must be rejected");
        assert_eq!(error.code, ParseErrorCode::CorruptDocument);
    }
}
