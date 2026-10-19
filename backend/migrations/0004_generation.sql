CREATE TABLE projects (
 id TEXT PRIMARY KEY CHECK (id GLOB 'srv-*' AND length(id)=40),
 title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
 prompt TEXT NOT NULL CHECK (length(prompt) BETWEEN 1 AND 50000),
 status TEXT NOT NULL CHECK (status IN ('draft','running','questions','outline_ready','ready','failed','cancelled')),
 revision INTEGER NOT NULL DEFAULT 1 CHECK (revision BETWEEN 1 AND 9007199254740991),
 outline_json TEXT CHECK (outline_json IS NULL OR json_valid(outline_json)),
 deck_json TEXT CHECK (deck_json IS NULL OR json_valid(deck_json)),
 deck_revision INTEGER NOT NULL DEFAULT 0 CHECK (deck_revision BETWEEN 0 AND 9007199254740991),
 latest_run_id TEXT REFERENCES generation_runs(id),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE INDEX projects_updated ON projects(updated_at DESC,id);
CREATE TABLE generation_runs (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES projects(id),
 stage TEXT NOT NULL CHECK (stage IN ('outline','slides')),
 status TEXT NOT NULL CHECK (status IN ('queued','running','questions','completed','failed','cancelled','interrupted')),
 instruction TEXT,
 history_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(history_json) AND json_type(history_json)='array'),
 config_json TEXT CHECK (config_json IS NULL OR json_valid(config_json)),
 questions_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(questions_json) AND json_type(questions_json)='array'),
 message TEXT NOT NULL DEFAULT '',
 error_code TEXT,
 outline_revision INTEGER,
 deck_revision INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
) STRICT;
CREATE UNIQUE INDEX generation_one_active ON generation_runs(project_id) WHERE status IN ('queued','running');
CREATE INDEX generation_project_runs ON generation_runs(project_id,created_at DESC,id);
CREATE TABLE generation_events (
 run_id TEXT NOT NULL REFERENCES generation_runs(id),
 sequence INTEGER NOT NULL CHECK (sequence > 0),
 kind TEXT NOT NULL,
 message TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(run_id,sequence)
) STRICT;
CREATE TABLE project_requests (
 scope TEXT NOT NULL,
 request_id TEXT NOT NULL,
 request_sha256 TEXT NOT NULL CHECK (length(request_sha256)=64),
 project_id TEXT NOT NULL REFERENCES projects(id),
 run_id TEXT REFERENCES generation_runs(id),
 PRIMARY KEY(scope,request_id)
) STRICT;
CREATE TABLE assets (
 sha256 TEXT PRIMARY KEY CHECK (length(sha256)=64 AND sha256 NOT GLOB '*[^0-9a-f]*'),
 mime TEXT NOT NULL CHECK (mime IN ('image/png','image/jpeg','image/webp')),
 byte_length INTEGER NOT NULL CHECK (byte_length BETWEEN 1 AND 20971520),
 width INTEGER NOT NULL CHECK (width BETWEEN 1 AND 16384),
 height INTEGER NOT NULL CHECK (height BETWEEN 1 AND 16384),
 CHECK (width*height <= 40000000)
) STRICT;
CREATE TABLE project_assets (
 project_id TEXT NOT NULL REFERENCES projects(id),
 asset_id TEXT NOT NULL REFERENCES assets(sha256),
 source TEXT NOT NULL CHECK (source IN ('upload','generate')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(project_id,asset_id)
) STRICT;
CREATE TABLE image_jobs (
 project_id TEXT NOT NULL REFERENCES projects(id),
 request_id TEXT NOT NULL,
 request_sha256 TEXT NOT NULL,
 kind TEXT NOT NULL CHECK (kind IN ('upload','generate')),
 state TEXT NOT NULL CHECK (state IN ('queued','processing','succeeded','failed','uncertain')),
 ratio TEXT NOT NULL DEFAULT '1:1',
 asset_id TEXT REFERENCES assets(sha256),
 error_code TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(project_id,request_id)
) STRICT;
