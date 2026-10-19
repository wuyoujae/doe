CREATE TABLE presentation_exports (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES projects(id),
 format TEXT NOT NULL CHECK(format IN ('pdf','pptx')),
 status TEXT NOT NULL CHECK(status IN ('queued','running','completed','failed','cancelled')),
 source_revision INTEGER NOT NULL CHECK(source_revision > 0),
 source_sha256 TEXT NOT NULL CHECK(length(source_sha256)=64),
 snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)),
 dedupe_key TEXT NOT NULL CHECK(length(dedupe_key)=64),
 renderer_contract TEXT NOT NULL,
 compiler_contract TEXT NOT NULL,
 writer_contract TEXT NOT NULL,
 embed_fonts INTEGER NOT NULL CHECK(embed_fonts IN (0,1)),
 file_name TEXT NOT NULL,
 owner_id TEXT,
 lease_expires_at INTEGER,
 output_sha256 TEXT,
 output_size_bytes INTEGER,
 error_code TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE UNIQUE INDEX presentation_exports_active ON presentation_exports(project_id,dedupe_key) WHERE status IN ('queued','running','completed');
CREATE INDEX presentation_exports_work ON presentation_exports(status,lease_expires_at,created_at);
