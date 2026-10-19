from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class Border:
    """A shape's border (line)."""

    width: Optional[float] = None
    """Border width in points."""

    color: Optional[str] = None
    """Border color hex, e.g. ``"000000"``."""

    alpha: Optional[float] = None
    """Border opacity 0-1 (1 = fully opaque)."""

    no_fill: bool = False
    """Explicit DrawingML ``noFill`` line; suppress style fallback and drawing."""

    dash: Optional[str] = None
    """Dash style: ``"solid"``, ``"dash"``, ``"dot"``, etc."""

    cap: Optional[str] = None
    """Line cap: ``"flat"``, ``"rnd"``, or ``"sq"``."""

    compound: Optional[str] = None
    """Compound line type such as ``"sng"``, ``"dbl"``, or ``"thickThin"``."""

    alignment: Optional[str] = None
    """Line alignment such as ``"ctr"``, ``"in"``, or ``"out"``."""

    join: Optional[str] = None
    """Line join: ``"round"``, ``"bevel"``, or ``"miter"``."""

    head_end_type: Optional[str] = None
    head_end_width: Optional[str] = None
    head_end_length: Optional[str] = None
    tail_end_type: Optional[str] = None
    tail_end_width: Optional[str] = None
    tail_end_length: Optional[str] = None
