from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class ThreeDInfo:
    """DrawingML 3D shape metadata with a Canvas-friendly first-pass surface."""

    bevel_top_width: Optional[float] = None
    bevel_top_height: Optional[float] = None
    bevel_top_preset: Optional[str] = None
    bevel_bottom_width: Optional[float] = None
    bevel_bottom_height: Optional[float] = None
    bevel_bottom_preset: Optional[str] = None
    extrusion_height: Optional[float] = None
    extrusion_color: Optional[str] = None
    extrusion_alpha: Optional[float] = None
    contour_width: Optional[float] = None
    contour_color: Optional[str] = None
    contour_alpha: Optional[float] = None
    preset_material: Optional[str] = None
    camera_preset: Optional[str] = None
    light_rig: Optional[str] = None
    light_direction: Optional[str] = None
    diagnostics: list[str] = field(default_factory=list)
