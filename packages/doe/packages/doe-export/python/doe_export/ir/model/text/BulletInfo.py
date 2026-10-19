from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class BulletInfo:
    """DrawingML bullet/list formatting for a paragraph."""

    kind: str = "none"
    """Bullet kind: ``"none"``, ``"char"``, ``"auto"``, or ``"blip"``."""

    char: Optional[str] = None
    auto_number_scheme: Optional[str] = None
    start_at: Optional[int] = None
    font_family: Optional[str] = None
    color: Optional[str] = None
    size_pct: Optional[float] = None
    size_pt: Optional[float] = None
    follows_text_color: bool = False
    follows_text_size: bool = False
    follows_text_font: bool = False
