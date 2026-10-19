from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class SlideTransition:
    """Slide transition metadata from ``p:transition``."""

    type: str = "none"
    speed: Optional[str] = None
    direction: Optional[str] = None
    duration_ms: Optional[int] = None
    advance_on_click: Optional[bool] = None
    advance_after_ms: Optional[int] = None
    raw_attrs: dict[str, str] = field(default_factory=dict)
