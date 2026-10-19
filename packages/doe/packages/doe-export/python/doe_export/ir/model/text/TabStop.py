from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class TabStop:
    """DrawingML paragraph tab stop."""

    position: Optional[float] = None
    """Tab position in points."""

    alignment: Optional[str] = None
    """Tab alignment, e.g. ``"l"``, ``"ctr"``, ``"r"``, ``"dec"``."""
