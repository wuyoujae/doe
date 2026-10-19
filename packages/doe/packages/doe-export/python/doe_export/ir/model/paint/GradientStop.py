from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class GradientStop:
    """A gradient color stop."""

    position: float = 0.0
    """Stop position from 0.0 to 1.0."""

    color: Optional[str] = None
    alpha: Optional[float] = None
