CREATE TABLE model_provider_kinds (
    provider TEXT NOT NULL CHECK (length(provider) BETWEEN 1 AND 64),
    kind TEXT NOT NULL CHECK (kind IN ('text', 'image')),
    PRIMARY KEY (provider, kind)
) STRICT;

INSERT INTO model_provider_kinds SELECT DISTINCT provider, kind FROM model_configs;

CREATE TABLE model_configs_next (
    kind TEXT PRIMARY KEY CHECK (kind IN ('text', 'image')),
    provider TEXT NOT NULL,
    base_url TEXT NOT NULL CHECK (length(base_url) <= 2048),
    model_id TEXT NOT NULL CHECK (length(model_id) <= 256),
    options_json TEXT NOT NULL CHECK (json_valid(options_json) AND json_type(options_json) = 'object'),
    key_ciphertext BLOB CHECK (key_ciphertext IS NULL OR length(key_ciphertext) >= 29),
    updated_at TEXT NOT NULL,
    FOREIGN KEY (provider, kind) REFERENCES model_provider_kinds(provider, kind),
    CHECK ((base_url = '' AND model_id = '') OR (base_url <> '' AND model_id <> '')),
    CHECK (key_ciphertext IS NULL OR (base_url <> '' AND model_id <> ''))
) STRICT;

INSERT INTO model_configs_next SELECT * FROM model_configs;
DROP TABLE model_configs;
ALTER TABLE model_configs_next RENAME TO model_configs;
