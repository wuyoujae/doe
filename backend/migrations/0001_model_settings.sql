CREATE TABLE model_settings_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    revision INTEGER NOT NULL CHECK (revision >= 0 AND revision <= 9007199254740991),
    updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE model_configs (
    kind TEXT PRIMARY KEY CHECK (kind IN ('text', 'image')),
    provider TEXT NOT NULL CHECK (provider IN ('custom', 'openai', 'openrouter', 'deepseek', 'anthropic', 'together', 'xai')),
    base_url TEXT NOT NULL CHECK (length(base_url) <= 2048),
    model_id TEXT NOT NULL CHECK (length(model_id) <= 256),
    options_json TEXT NOT NULL CHECK (json_valid(options_json) AND json_type(options_json) = 'object'),
    key_ciphertext BLOB CHECK (key_ciphertext IS NULL OR length(key_ciphertext) >= 29),
    updated_at TEXT NOT NULL,
    CHECK ((kind = 'text' AND provider IN ('custom', 'openai', 'openrouter', 'deepseek', 'anthropic'))
        OR (kind = 'image' AND provider IN ('custom', 'openai', 'together', 'xai'))),
    CHECK ((base_url = '' AND model_id = '') OR (base_url <> '' AND model_id <> '')),
    CHECK (key_ciphertext IS NULL OR (base_url <> '' AND model_id <> ''))
) STRICT;

INSERT INTO model_settings_state VALUES (1, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
INSERT INTO model_configs (kind, provider, base_url, model_id, options_json, updated_at)
VALUES ('text', 'custom', '', '', '{}', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
       ('image', 'custom', '', '', '{}', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
