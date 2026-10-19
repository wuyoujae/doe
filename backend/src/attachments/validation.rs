use std::path::Path;

use super::types::{UploadError, UploadPipeline};

const MAX_FILENAME_CHARS: usize = 255;
const MAX_FILENAME_BYTES: usize = 1_024;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClassifiedUpload {
    pub pipeline: UploadPipeline,
    pub detected_type: String,
    pub mime_type: String,
    pub extension: String,
}

pub fn normalize_original_name(value: &str) -> Result<String, UploadError> {
    let name = value
        .trim()
        .rsplit(['/', '\\'])
        .next()
        .unwrap_or_default()
        .trim();
    if name.is_empty()
        || name == "."
        || name == ".."
        || name.chars().count() > MAX_FILENAME_CHARS
        || name.len() > MAX_FILENAME_BYTES
        || name.chars().any(char::is_control)
    {
        return Err(UploadError::validation(
            "invalid_file_name",
            "The uploaded file name is invalid.",
        ));
    }
    Ok(name.to_string())
}

pub fn validate_client_id(value: &str, field: &str) -> Result<String, UploadError> {
    let value = value.trim();
    if value.is_empty()
        || value.len() > 128
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.' | b':'))
    {
        return Err(UploadError::validation(
            "invalid_upload_request",
            format!("{field} is invalid."),
        ));
    }
    Ok(value.to_string())
}

pub fn classify_upload(
    original_name: &str,
    declared_mime_type: Option<&str>,
    header: &[u8],
    size_bytes: u64,
) -> Result<ClassifiedUpload, UploadError> {
    if size_bytes == 0 {
        return Err(UploadError::validation(
            "empty_upload",
            "The uploaded file is empty.",
        ));
    }
    let extension = Path::new(original_name)
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .ok_or_else(|| {
            UploadError::validation(
                "unsupported_file_type",
                "The uploaded file must have a supported extension.",
            )
        })?;

    if matches!(extension.as_str(), "doc" | "ppt" | "xls") {
        return Err(UploadError::validation(
            "legacy_office_unsupported",
            "Legacy .doc, .ppt, and .xls files are not supported.",
        ));
    }

    let (pipeline, detected_type, canonical_mime, allowed_mimes): (
        UploadPipeline,
        &str,
        &str,
        &[&str],
    ) = match extension.as_str() {
        "pdf" => (
            UploadPipeline::Document,
            "pdf",
            "application/pdf",
            &["application/pdf"],
        ),
        "docx" => (
            UploadPipeline::Document,
            "docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            &[
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/msword",
                "application/zip",
            ],
        ),
        "pptx" => (
            UploadPipeline::Document,
            "pptx",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            &[
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "application/vnd.ms-powerpoint",
                "application/zip",
            ],
        ),
        "xlsx" => (
            UploadPipeline::Document,
            "xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            &[
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "application/zip",
            ],
        ),
        "html" | "htm" => (
            UploadPipeline::Document,
            "html",
            "text/html",
            &["text/html", "application/xhtml+xml", "text/plain"],
        ),
        "md" => (
            UploadPipeline::Document,
            "md",
            "text/markdown",
            &["text/markdown", "text/plain", "text/x-markdown"],
        ),
        "csv" => (
            UploadPipeline::Document,
            "csv",
            "text/csv",
            &[
                "text/csv",
                "text/plain",
                "application/csv",
                "application/vnd.ms-excel",
            ],
        ),
        "txt" => (
            UploadPipeline::Document,
            "txt",
            "text/plain",
            &["text/plain"],
        ),
        "json" => (
            UploadPipeline::Document,
            "json",
            "application/json",
            &["application/json", "text/json", "text/plain"],
        ),
        "png" => (UploadPipeline::Image, "png", "image/png", &["image/png"]),
        "jpg" | "jpeg" => (
            UploadPipeline::Image,
            "jpeg",
            "image/jpeg",
            &["image/jpeg", "image/jpg"],
        ),
        "webp" => (UploadPipeline::Image, "webp", "image/webp", &["image/webp"]),
        "mp3" => (
            UploadPipeline::Audio,
            "mp3",
            "audio/mpeg",
            &["audio/mpeg", "audio/mp3"],
        ),
        "wav" => (
            UploadPipeline::Audio,
            "wav",
            "audio/wav",
            &["audio/wav", "audio/wave", "audio/x-wav"],
        ),
        "m4a" => (
            UploadPipeline::Audio,
            "m4a",
            "audio/mp4",
            &["audio/mp4", "audio/m4a", "audio/x-m4a"],
        ),
        "aac" => (
            UploadPipeline::Audio,
            "aac",
            "audio/aac",
            &["audio/aac", "audio/x-aac"],
        ),
        "flac" => (
            UploadPipeline::Audio,
            "flac",
            "audio/flac",
            &["audio/flac", "audio/x-flac"],
        ),
        "ogg" => (
            UploadPipeline::Audio,
            "ogg",
            "audio/ogg",
            &["audio/ogg", "application/ogg"],
        ),
        "mp4" => (UploadPipeline::Video, "mp4", "video/mp4", &["video/mp4"]),
        "mov" => (
            UploadPipeline::Video,
            "mov",
            "video/quicktime",
            &["video/quicktime", "video/mov"],
        ),
        "webm" => (UploadPipeline::Video, "webm", "video/webm", &["video/webm"]),
        "mpeg" | "mpg" => (UploadPipeline::Video, "mpeg", "video/mpeg", &["video/mpeg"]),
        _ => {
            return Err(UploadError::validation(
                "unsupported_file_type",
                "The uploaded file type is not supported.",
            ));
        }
    };

    if size_bytes > pipeline.max_bytes() {
        return Err(UploadError::validation(
            "upload_too_large",
            format!(
                "The uploaded {} file exceeds its {} MiB limit.",
                pipeline,
                pipeline.max_bytes() / (1024 * 1024)
            ),
        ));
    }

    validate_declared_mime(declared_mime_type, allowed_mimes)?;
    validate_magic(detected_type, header)?;
    Ok(ClassifiedUpload {
        pipeline,
        detected_type: detected_type.to_string(),
        mime_type: canonical_mime.to_string(),
        extension: match extension.as_str() {
            "jpeg" => "jpg".to_string(),
            "htm" => "html".to_string(),
            "mpg" => "mpeg".to_string(),
            _ => extension,
        },
    })
}

pub fn upload_size_limit_for_name(original_name: &str) -> Result<u64, UploadError> {
    let original_name = normalize_original_name(original_name)?;
    let extension = Path::new(&original_name)
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .ok_or_else(|| {
            UploadError::validation(
                "unsupported_file_type",
                "The uploaded file must have a supported extension.",
            )
        })?;
    let pipeline = match extension.as_str() {
        "pdf" | "docx" | "pptx" | "xlsx" | "html" | "htm" | "md" | "csv" | "txt" | "json" => {
            UploadPipeline::Document
        }
        "png" | "jpg" | "jpeg" | "webp" => UploadPipeline::Image,
        "mp3" | "wav" | "m4a" | "aac" | "flac" | "ogg" => UploadPipeline::Audio,
        "mp4" | "mov" | "webm" | "mpeg" | "mpg" => UploadPipeline::Video,
        "doc" | "ppt" | "xls" => {
            return Err(UploadError::validation(
                "legacy_office_unsupported",
                "Legacy .doc, .ppt, and .xls files are not supported.",
            ));
        }
        _ => {
            return Err(UploadError::validation(
                "unsupported_file_type",
                "The uploaded file type is not supported.",
            ));
        }
    };
    Ok(pipeline.max_bytes())
}

fn validate_declared_mime(
    declared_mime_type: Option<&str>,
    allowed: &[&str],
) -> Result<(), UploadError> {
    let Some(value) = declared_mime_type
        .and_then(|value| value.split(';').next())
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Ok(());
    };
    let value = value.to_ascii_lowercase();
    if matches!(
        value.as_str(),
        "application/octet-stream" | "binary/octet-stream"
    ) || allowed.iter().any(|candidate| *candidate == value)
    {
        return Ok(());
    }
    Err(UploadError::validation(
        "file_type_mismatch",
        "The declared media type does not match the file extension.",
    ))
}

fn validate_magic(detected_type: &str, header: &[u8]) -> Result<(), UploadError> {
    let valid = match detected_type {
        "pdf" => header
            .windows(5)
            .take(1_024)
            .any(|window| window == b"%PDF-"),
        "docx" | "pptx" | "xlsx" => {
            header.starts_with(b"PK\x03\x04")
                || header.starts_with(b"PK\x05\x06")
                || header.starts_with(b"PK\x07\x08")
        }
        "png" => header.starts_with(b"\x89PNG\r\n\x1a\n"),
        "jpeg" => header.starts_with(b"\xff\xd8\xff"),
        "webp" => header.len() >= 12 && &header[..4] == b"RIFF" && &header[8..12] == b"WEBP",
        "mp3" => {
            header.starts_with(b"ID3")
                || (header.len() >= 2 && header[0] == 0xff && header[1] & 0xe0 == 0xe0)
        }
        "wav" => header.len() >= 12 && &header[..4] == b"RIFF" && &header[8..12] == b"WAVE",
        "m4a" | "mp4" | "mov" => header.len() >= 12 && &header[4..8] == b"ftyp",
        "aac" => header.len() >= 2 && header[0] == 0xff && matches!(header[1] & 0xf6, 0xf0 | 0xf4),
        "flac" => header.starts_with(b"fLaC"),
        "ogg" => header.starts_with(b"OggS"),
        "webm" => header.starts_with(b"\x1a\x45\xdf\xa3"),
        "mpeg" => {
            header.starts_with(b"\x00\x00\x01\xba") || header.starts_with(b"\x00\x00\x01\xb3")
        }
        "html" | "md" | "csv" | "txt" | "json" => true,
        _ => false,
    };
    if valid {
        Ok(())
    } else {
        Err(UploadError::validation(
            "file_type_mismatch",
            "The file content does not match its extension.",
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classifies_supported_pipelines() {
        assert_eq!(
            classify_upload("brief.pdf", Some("application/pdf"), b"%PDF-1.7", 100)
                .unwrap()
                .pipeline,
            UploadPipeline::Document
        );
        assert_eq!(
            classify_upload("photo.png", Some("image/png"), b"\x89PNG\r\n\x1a\n", 100)
                .unwrap()
                .pipeline,
            UploadPipeline::Image
        );
        assert_eq!(
            classify_upload("voice.mp3", Some("audio/mpeg"), b"ID3\x04", 100)
                .unwrap()
                .pipeline,
            UploadPipeline::Audio
        );
        let mut mp4 = vec![0, 0, 0, 20];
        mp4.extend_from_slice(b"ftypisom");
        assert_eq!(
            classify_upload("clip.mp4", Some("video/mp4"), &mp4, 100)
                .unwrap()
                .pipeline,
            UploadPipeline::Video
        );
    }

    #[test]
    fn rejects_mismatched_and_legacy_files() {
        assert_eq!(
            classify_upload("fake.png", Some("image/png"), b"not-png", 100)
                .unwrap_err()
                .code,
            "file_type_mismatch"
        );
        assert_eq!(
            classify_upload("legacy.doc", None, b"anything", 100)
                .unwrap_err()
                .code,
            "legacy_office_unsupported"
        );
    }
}
