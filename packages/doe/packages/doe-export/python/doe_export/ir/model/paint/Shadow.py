from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class Shadow:
    """Shape shadow effect."""

    type: str = "outer"  # "outer", "inner"
    blur_pt: Optional[float] = None
    offset_x: Optional[float] = None
    offset_y: Optional[float] = None
    color: Optional[str] = None
    alpha: Optional[float] = None
    diagnostics: list[str] = field(default_factory=list)
