from __future__ import annotations

import os
import tempfile
from dataclasses import dataclass
from pathlib import Path


class ConfigurationError(RuntimeError):
    """Raised when the service cannot start safely with its environment."""


_UNSAFE_TOKEN_PLACEHOLDER = "replace-with-at-least-32-random-characters"
_ENV_PREFIXES = (
    "YRKIE_FILE_PARSER_",
    "OTHERONE_FILE_PARSER_",
    "FILE_PARSER_",
)


def _read_env(suffix: str, *aliases: str) -> tuple[str | None, str]:
    suffixes = (suffix, *aliases)
    for prefix in _ENV_PREFIXES:
        for candidate_suffix in suffixes:
            name = f"{prefix}{candidate_suffix}"
            raw = os.getenv(name)
            if raw is not None:
                return raw, name
    return None, f"YRKIE_FILE_PARSER_{suffix}"


def _read_int(suffix: str, default: int, *, minimum: int, maximum: int) -> int:
    raw, name = _read_env(suffix)
    if raw is None or not raw.strip():
        return default
    try:
        value = int(raw)
    except ValueError as exc:
        raise ConfigurationError(f"{name} must be an integer") from exc
    if not minimum <= value <= maximum:
        raise ConfigurationError(f"{name} must be between {minimum} and {maximum}")
    return value


def _read_bool(suffix: str, default: bool) -> bool:
    raw, name = _read_env(suffix)
    if raw is None or not raw.strip():
        return default
    normalized = raw.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ConfigurationError(f"{name} must be true or false")


@dataclass(frozen=True, slots=True)
class Settings:
    internal_token: str
    host: str = "127.0.0.1"
    port: int = 17830
    model_path: Path | None = None
    eager_init: bool = True
    timeout_seconds: int = 300
    max_concurrency: int = 1
    busy_timeout_seconds: int = 30
    max_file_bytes: int = 30 * 1024 * 1024
    max_pages: int = 500
    max_content_chars: int = 2_000_000
    max_ooxml_entries: int = 10_000
    max_ooxml_uncompressed_bytes: int = 300 * 1024 * 1024
    max_ooxml_compression_ratio: int = 200
    temp_dir: Path = Path(tempfile.gettempdir()) / "yrkie-file-parser"
    temp_ttl_seconds: int = 24 * 60 * 60
    log_level: str = "INFO"
    environment: str = "development"
    release: str = "unknown"
    error_ingest_url: str | None = None
    error_ingest_token: str | None = None

    def __post_init__(self) -> None:
        if self.internal_token == _UNSAFE_TOKEN_PLACEHOLDER:
            raise ConfigurationError(
                "YRKIE_FILE_PARSER_INTERNAL_TOKEN placeholder must be replaced"
            )
        if (
            len(self.internal_token) < 32
            or len(self.internal_token) > 4_096
            or any(
                character.isspace() or not character.isprintable()
                for character in self.internal_token
            )
        ):
            raise ConfigurationError(
                "YRKIE_FILE_PARSER_INTERNAL_TOKEN must contain at least 32 and at most 4096 "
                "printable non-whitespace characters"
            )
        if self.environment not in {"development", "test", "production"}:
            raise ConfigurationError("YRKIE_ENVIRONMENT is invalid")
        if self.error_ingest_token is not None and (
            len(self.error_ingest_token) < 32
            or len(self.error_ingest_token) > 4_096
            or any(
                character.isspace() or not character.isprintable()
                for character in self.error_ingest_token
            )
        ):
            raise ConfigurationError(
                "ADMIN_ERROR_INGEST_FILE_PARSER_TOKEN must contain 32 to 4096 safe characters"
            )
        if self.environment == "production" and not self.error_ingest_token:
            raise ConfigurationError(
                "ADMIN_ERROR_INGEST_FILE_PARSER_TOKEN is required in production"
            )

    @property
    def max_request_bytes(self) -> int:
        return self.max_file_bytes + 1024 * 1024

    @classmethod
    def from_env(cls) -> Settings:
        raw_host, _ = _read_env("HOST")
        host = (raw_host or "127.0.0.1").strip()
        if not host:
            raise ConfigurationError("YRKIE_FILE_PARSER_HOST cannot be empty")

        raw_token, _ = _read_env("INTERNAL_TOKEN", "TOKEN")
        token = (raw_token or "").strip() or None
        if token is None:
            raise ConfigurationError("YRKIE_FILE_PARSER_INTERNAL_TOKEN is required")
        raw_model_path_value, _ = _read_env("MODEL_PATH")
        raw_model_path = raw_model_path_value.strip() if raw_model_path_value else ""
        model_path = Path(raw_model_path).expanduser().resolve() if raw_model_path else None
        if model_path is not None and not model_path.is_dir():
            raise ConfigurationError("YRKIE_FILE_PARSER_MODEL_PATH must be an existing directory")

        raw_temp_dir_value, _ = _read_env("TEMP_DIR")
        raw_temp_dir = raw_temp_dir_value.strip() if raw_temp_dir_value else ""
        temp_dir = (
            Path(raw_temp_dir).expanduser().resolve()
            if raw_temp_dir
            else Path(tempfile.gettempdir()) / "yrkie-file-parser"
        )

        raw_log_level, _ = _read_env("LOG_LEVEL")
        log_level = (raw_log_level or "INFO").strip().upper()
        if log_level not in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
            raise ConfigurationError("YRKIE_FILE_PARSER_LOG_LEVEL is invalid")
        environment = os.getenv("YRKIE_ENVIRONMENT", "development").strip().lower()
        release = os.getenv("YRKIE_RELEASE", "unknown").strip() or "unknown"
        error_ingest_url = os.getenv(
            "ADMIN_ERROR_INGEST_URL",
            "http://127.0.0.1:4434/api/internal/operational-errors",
        ).strip()
        error_ingest_token = os.getenv("ADMIN_ERROR_INGEST_FILE_PARSER_TOKEN", "").strip() or None

        return cls(
            host=host,
            port=_read_int("PORT", 17830, minimum=1, maximum=65_535),
            internal_token=token,
            model_path=model_path,
            eager_init=_read_bool("EAGER_INIT", True),
            timeout_seconds=_read_int("TIMEOUT_SECONDS", 300, minimum=1, maximum=3_600),
            max_concurrency=_read_int("MAX_CONCURRENCY", 1, minimum=1, maximum=16),
            busy_timeout_seconds=_read_int("BUSY_TIMEOUT_SECONDS", 30, minimum=0, maximum=30),
            max_file_bytes=_read_int(
                "MAX_FILE_BYTES",
                30 * 1024 * 1024,
                minimum=1,
                maximum=1024 * 1024 * 1024,
            ),
            max_pages=_read_int("MAX_PAGES", 500, minimum=1, maximum=10_000),
            max_content_chars=_read_int(
                "MAX_CONTENT_CHARS",
                2_000_000,
                minimum=1,
                maximum=100_000_000,
            ),
            max_ooxml_entries=_read_int("MAX_OOXML_ENTRIES", 10_000, minimum=10, maximum=100_000),
            max_ooxml_uncompressed_bytes=_read_int(
                "MAX_OOXML_UNCOMPRESSED_BYTES",
                300 * 1024 * 1024,
                minimum=1024,
                maximum=4 * 1024 * 1024 * 1024,
            ),
            max_ooxml_compression_ratio=_read_int(
                "MAX_OOXML_COMPRESSION_RATIO",
                200,
                minimum=2,
                maximum=10_000,
            ),
            temp_dir=temp_dir,
            temp_ttl_seconds=_read_int(
                "TEMP_TTL_SECONDS",
                24 * 60 * 60,
                minimum=60,
                maximum=30 * 24 * 60 * 60,
            ),
            log_level=log_level,
            environment=environment,
            release=release,
            error_ingest_url=error_ingest_url,
            error_ingest_token=error_ingest_token,
        )
