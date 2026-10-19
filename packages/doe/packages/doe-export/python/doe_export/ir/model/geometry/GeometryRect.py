from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class GeometryRect:
    """Geometry text rectangle in normalized 0-100 shape coordinates."""

    left: float = 0.0
    top: float = 0.0
    right: float = 100.0
    bottom: float = 100.0
