CREATE TABLE doe_settings_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 0 AND 9007199254740991),
    updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE doe_defaults (
    id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 128),
    kind TEXT NOT NULL CHECK (kind IN ('prompt', 'schema', 'skill')),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL CHECK (length(CAST(content AS BLOB)) BETWEEN 1 AND 524288),
    enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
    source_json TEXT NOT NULL CHECK (json_valid(source_json) AND json_type(source_json) = 'object'),
    ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
    CHECK (kind = 'skill' OR enabled = 1)
) STRICT;

CREATE TABLE doe_overrides (
    entry_id TEXT PRIMARY KEY REFERENCES doe_defaults(id),
    content TEXT CHECK (content IS NULL OR length(CAST(content AS BLOB)) BETWEEN 1 AND 524288),
    enabled INTEGER CHECK (enabled IS NULL OR enabled IN (0, 1)),
    CHECK (content IS NOT NULL OR enabled IS NOT NULL)
) STRICT;

CREATE TABLE doe_revisions (
    revision INTEGER NOT NULL CHECK (revision BETWEEN 0 AND 9007199254740991),
    entry_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('prompt', 'schema', 'skill')),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
    source_json TEXT NOT NULL CHECK (json_valid(source_json)),
    created_at TEXT NOT NULL,
    PRIMARY KEY (revision, entry_id)
) STRICT;

INSERT INTO doe_settings_state VALUES (1, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
