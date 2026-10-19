from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.paint.Shadow import Shadow

@dataclass
@preserve_identity
class ImageInfo:
    """Image data for a picture shape."""

    content_type: str = ""
    data: str = ""
    """Base64-encoded image data."""

    url: Optional[str] = None
    """External browser-loadable image URL. Preferred for generated/template IR."""

    preview_content_type: Optional[str] = None
    preview_data: Optional[str] = None
    """Optional compressed browser/Canvas preview; PPTX export still uses ``data``."""

    embed_id: Optional[str] = None
    """Original relationship ID (for file‑mode output)."""

    crop_left: float = 0.0
    crop_right: float = 0.0
    crop_top: float = 0.0
    crop_bottom: float = 0.0

    alpha: Optional[float] = None
    """Image opacity 0-1 after DrawingML blip alpha transforms."""

    effects: list[Shadow] = field(default_factory=list)
    """DrawingML effects applied directly to the image blip."""

    intrinsic_width_pt: Optional[float] = None
    intrinsic_height_pt: Optional[float] = None
    """Physical source dimensions used by DrawingML tile scaling."""

    tile: bool = False
    tile_scale_x: Optional[float] = None
    tile_scale_y: Optional[float] = None
    tile_offset_x_pt: Optional[float] = None
    tile_offset_y_pt: Optional[float] = None
    tile_align: Optional[str] = None
    tile_flip: Optional[str] = None
    stretch_left: Optional[float] = None
    stretch_right: Optional[float] = None
    stretch_top: Optional[float] = None
    stretch_bottom: Optional[float] = None
    """Crop fractions 0‑1."""
