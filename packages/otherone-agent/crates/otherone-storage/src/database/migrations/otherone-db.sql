-- Otherone 数据库表设计（PostgreSQL）
-- 用于存储会话、消息和压缩对话的数据
-- Rust 版本参考 —— 实际建表逻辑在 otherone-storage/src/database/init.rs 中

-- 会话表
CREATE TABLE IF NOT EXISTS otherone_session (
    session_id VARCHAR(36) PRIMARY KEY,
    status SMALLINT NOT NULL DEFAULT 0,
    create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_session_status ON otherone_session(status);
CREATE INDEX IF NOT EXISTS idx_session_create_at ON otherone_session(create_at);

-- 消息记录表
CREATE TABLE IF NOT EXISTS otherone_entries (
    entry_id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    role VARCHAR(50) NOT NULL,
    token_consumption INT DEFAULT 0,
    status SMALLINT NOT NULL DEFAULT 0,
    tools TEXT,
    create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_compaction SMALLINT NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_entries_session_id ON otherone_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON otherone_entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_create_at ON otherone_entries(create_at);
CREATE INDEX IF NOT EXISTS idx_entries_is_compaction ON otherone_entries(is_compaction);

-- 压缩记录表
CREATE TABLE IF NOT EXISTS otherone_compacted_entries (
    entry_id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    trigger_entry_id VARCHAR(36) NOT NULL,
    summary TEXT NOT NULL,
    create_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_compacted_session_id ON otherone_compacted_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_compacted_trigger_entry_id ON otherone_compacted_entries(trigger_entry_id);
CREATE INDEX IF NOT EXISTS idx_compacted_status ON otherone_compacted_entries(status);
CREATE INDEX IF NOT EXISTS idx_compacted_create_at ON otherone_compacted_entries(create_at);
