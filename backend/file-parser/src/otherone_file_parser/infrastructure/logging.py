from __future__ import annotations

import json
import logging
from datetime import UTC, datetime

_SAFE_EXTRA_FIELDS = {
    "request_id",
    "event",
    "detected_type",
    "size_bytes",
    "duration_ms",
    "error_code",
    "removed_count",
    "exception_type",
}


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "event": getattr(record, "event", record.getMessage()),
        }
        for field in _SAFE_EXTRA_FIELDS:
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = value
        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def configure_logging(level: str) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    package_logger = logging.getLogger("otherone_file_parser")
    package_logger.handlers.clear()
    package_logger.addHandler(handler)
    package_logger.setLevel(level)
    package_logger.propagate = False
