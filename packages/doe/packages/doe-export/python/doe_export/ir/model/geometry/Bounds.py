from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class Bounds:
    """Position and size in points."""

    left: float = 0.0
    top: float = 0.0
    width: float = 0.0
    height: float = 0.0
