CREATE TABLE playbacks (
 project_id TEXT PRIMARY KEY REFERENCES projects(id),
 presenter_link TEXT NOT NULL UNIQUE CHECK (length(presenter_link)=64),
 audience_link TEXT NOT NULL UNIQUE CHECK (length(audience_link)=64),
 revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
 source_revision INTEGER NOT NULL DEFAULT 0,
 snapshot_json TEXT CHECK (snapshot_json IS NULL OR json_valid(snapshot_json))
) STRICT;
CREATE TABLE playback_notes (
 project_id TEXT NOT NULL REFERENCES projects(id),
 slide_id TEXT NOT NULL,
 content TEXT NOT NULL CHECK (length(CAST(content AS BLOB)) <= 60000),
 revision INTEGER NOT NULL CHECK (revision > 0),
 source_revision INTEGER NOT NULL,
 source_slide_sha256 TEXT NOT NULL CHECK (length(source_slide_sha256)=64),
 PRIMARY KEY(project_id,slide_id)
) STRICT;
