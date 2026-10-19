"""OOXML color helpers."""

import re
from typing import Optional


_HEX_COLOR_RE = re.compile(r"[0-9A-Fa-f]{6}")


def normalize_hex_color(value: str | None) -> Optional[str]:
    """Return an uppercase six-digit hex color or ``None``.

    Theme tokens such as ``accent1`` are intentionally rejected here;
    they must be resolved through the theme parser before rendering.
    """
    if value and _HEX_COLOR_RE.fullmatch(value):
        return value.upper()
    return None
