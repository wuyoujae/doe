-- Keep existing phase/FK contracts; mode distinguishes authoring from later edits.
ALTER TABLE generation_runs ADD COLUMN mode TEXT NOT NULL DEFAULT 'generate' CHECK(mode IN ('generate','edit'));
ALTER TABLE generation_runs ADD COLUMN conversation_bytes INTEGER NOT NULL DEFAULT 0 CHECK(conversation_bytes >= 0);
CREATE TABLE conversation_events (
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,
 project_id TEXT NOT NULL REFERENCES projects(id),
 run_id TEXT REFERENCES generation_runs(id),
 kind TEXT NOT NULL,
 payload_json TEXT NOT NULL CHECK(json_valid(payload_json) AND json_type(payload_json)='object'),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE INDEX conversation_project_sequence ON conversation_events(project_id,sequence);
CREATE INDEX conversation_run_sequence ON conversation_events(run_id,sequence);
CREATE TABLE conversation_backfills (
 project_id TEXT PRIMARY KEY REFERENCES projects(id),
 completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE TABLE deck_edit_operations (
 run_id TEXT NOT NULL REFERENCES generation_runs(id),
 tool_call_id TEXT NOT NULL,
 request_sha256 TEXT NOT NULL,
 deck_revision INTEGER NOT NULL,
 PRIMARY KEY(run_id,tool_call_id)
) STRICT;
