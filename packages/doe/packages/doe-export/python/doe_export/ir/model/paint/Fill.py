from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.paint.GradientStop import GradientStop

@dataclass
@preserve_identity
class Fill:
    """A shape's fill."""

    type: str = "none"
    """Fill type: ``"solid"``, ``"gradient"``, ``"none"``."""

    color: Optional[str] = None
    """Solid fill hex color, e.g. ``"005EB8"``."""

    # FIXME: gradient fields (stops, angle, path) — see FIXME.md

    alpha: Optional[float] = None
    """Fill opacity 0‑1 (1 = fully opaque)."""

    gradient_stops: list[GradientStop] = field(default_factory=list)
    gradient_angle: Optional[float] = None
    gradient_path: Optional[str] = None
    gradient_rotate_with_shape: Optional[bool] = None
    gradient_scaled: Optional[bool] = None
    gradient_fill_to_left: Optional[float] = None
    gradient_fill_to_right: Optional[float] = None
    gradient_fill_to_top: Optional[float] = None
    gradient_fill_to_bottom: Optional[float] = None

    pattern_preset: Optional[str] = None
    pattern_fg_color: Optional[str] = None
    pattern_bg_color: Optional[str] = None

    image: Optional["ImageInfo"] = None
