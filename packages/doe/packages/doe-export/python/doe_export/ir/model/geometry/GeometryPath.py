from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class GeometryPath:
    """Renderable DrawingML geometry path in normalized 0-100 coordinates."""

    d: str = ""
    fill: str = "norm"
    stroke: bool = True
