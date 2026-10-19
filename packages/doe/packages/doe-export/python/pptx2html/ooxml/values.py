"""OOXML scalar value helpers."""

from typing import Optional


def parse_bool(value: str | None) -> Optional[bool]:
    """Parse common OOXML boolean lexical values."""
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized in ("1", "true", "on"):
        return True
    if normalized in ("0", "false", "off"):
        return False
    return None
