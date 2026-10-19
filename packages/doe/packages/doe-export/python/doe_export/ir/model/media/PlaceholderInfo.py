from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class PlaceholderInfo:
    """Placeholder metadata."""

    type: str = "body"
    idx: int = 0
    orientation: Optional[str] = None
    size: Optional[str] = None
