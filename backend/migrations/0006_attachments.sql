CREATE TABLE uploads (
    upload_id TEXT PRIMARY KEY,
    client_upload_id TEXT NOT NULL,
    draft_id TEXT NOT NULL,
    project_id TEXT REFERENCES projects(id),
    pipeline TEXT NOT NULL CHECK(pipeline IN ('document','image')),
    status TEXT NOT NULL CHECK(status IN ('processing','ready','failed','deleted')),
    original_name TEXT NOT NULL,
    detected_type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL CHECK(size_bytes > 0 AND size_bytes <= 31457280),
    sha256 TEXT NOT NULL CHECK(length(sha256)=64),
    parsed_markdown TEXT NOT NULL DEFAULT '',
    content_chars INTEGER NOT NULL DEFAULT 0,
    estimated_tokens INTEGER NOT NULL DEFAULT 0,
    warnings_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(warnings_json)),
    width INTEGER,
    height INTEGER,
    attempt INTEGER NOT NULL DEFAULT 1 CHECK(attempt > 0),
    error_code TEXT NOT NULL DEFAULT '',
    error_message TEXT NOT NULL DEFAULT '',
    retryable INTEGER NOT NULL DEFAULT 0 CHECK(retryable IN (0,1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE(draft_id,client_upload_id)
) STRICT;
CREATE INDEX uploads_draft ON uploads(draft_id,created_at) WHERE status != 'deleted';
CREATE INDEX uploads_project ON uploads(project_id,created_at) WHERE status != 'deleted';
CREATE TABLE upload_cancellations (
    draft_id TEXT NOT NULL,
    client_upload_id TEXT NOT NULL,
    PRIMARY KEY(draft_id,client_upload_id)
) STRICT;
