# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._image_pattern_definition
from __future__ import annotations
from doe_export.html.renderer.shared import html

def _image_pattern_definition(
    self,
    image,
    pattern_id: str,
    width_pt: float,
    height_pt: float,
    *,
    opacity_multiplier: float | None = None,
    source: str | None = None,
) -> str:
    src = html.escape(source if source is not None else self._image_src(image), quote=True)
    opacity = self._image_opacity(image, opacity_multiplier)
    effect_filter = self._image_effect_filter(image)
    filter_attr = (
        f' style="filter:{html.escape(effect_filter, quote=True)}"'
        if effect_filter
        else ""
    )
    if not image.tile:
        image_x, image_y, image_w, image_h = self._image_placement(image)
        return (
            f'<pattern id="{pattern_id}" patternUnits="userSpaceOnUse" '
            'patternContentUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">'
            f'<image href="{src}" x="{image_x * 100.0:.8f}" '
            f'y="{image_y * 100.0:.8f}" width="{image_w * 100.0:.8f}" '
            f'height="{image_h * 100.0:.8f}" opacity="{opacity:.6f}"{filter_attr} '
            'preserveAspectRatio="none"/>'
            '</pattern>'
        )

    left, right, top, bottom = self._normalized_crop(image)
    visible_w = max(0.001, 1.0 - left - right)
    visible_h = max(0.001, 1.0 - top - bottom)
    intrinsic_w, intrinsic_h = self._image_intrinsic_size_pt(image)
    frame_w = max(0.001, float(width_pt or 0.0))
    frame_h = max(0.001, float(height_pt or 0.0))
    scale_x = max(0.001, abs(self._finite_float(image.tile_scale_x) or 1.0))
    scale_y = max(0.001, abs(self._finite_float(image.tile_scale_y) or 1.0))
    tile_w = (
        intrinsic_w * scale_x * visible_w / frame_w * 100.0
        if intrinsic_w > 0
        else 100.0
    )
    tile_h = (
        intrinsic_h * scale_y * visible_h / frame_h * 100.0
        if intrinsic_h > 0
        else 100.0
    )
    tile_w = max(0.01, min(10000.0, tile_w))
    tile_h = max(0.01, min(10000.0, tile_h))
    flip = str(image.tile_flip or "").lower()
    flip_x = "x" in flip
    flip_y = "y" in flip
    period_w = tile_w * (2.0 if flip_x else 1.0)
    period_h = tile_h * (2.0 if flip_y else 1.0)
    align = str(image.tile_align or "tl").lower()
    horizontal = 0.5 if align in {"t", "ctr", "b"} else (1.0 if align in {"tr", "r", "br"} else 0.0)
    vertical = 0.5 if align in {"l", "ctr", "r"} else (1.0 if align in {"bl", "b", "br"} else 0.0)
    offset_x = self._finite_float(getattr(image, "tile_offset_x_pt", None)) / frame_w * 100.0
    offset_y = self._finite_float(getattr(image, "tile_offset_y_pt", None)) / frame_h * 100.0
    origin_x = (100.0 - tile_w) * horizontal + offset_x
    origin_y = (100.0 - tile_h) * vertical + offset_y
    source_x = -left / visible_w * 100.0
    source_y = -top / visible_h * 100.0
    source_w = 100.0 / visible_w
    source_h = 100.0 / visible_h

    cells: list[str] = []
    for row in range(2 if flip_y else 1):
        for column in range(2 if flip_x else 1):
            mirror_x = bool(column % 2)
            mirror_y = bool(row % 2)
            tx = column * tile_w + (tile_w if mirror_x else 0.0)
            ty = row * tile_h + (tile_h if mirror_y else 0.0)
            sx = -1 if mirror_x else 1
            sy = -1 if mirror_y else 1
            cells.append(
                f'<g transform="translate({tx:.8f} {ty:.8f}) scale({sx} {sy})">'
                f'<svg x="0" y="0" width="{tile_w:.8f}" height="{tile_h:.8f}" '
                'viewBox="0 0 100 100" preserveAspectRatio="none" overflow="hidden">'
                f'<image href="{src}" x="{source_x:.8f}" y="{source_y:.8f}" '
                f'width="{source_w:.8f}" height="{source_h:.8f}" '
                f'opacity="{opacity:.6f}"{filter_attr} preserveAspectRatio="none"/>'
                '</svg></g>'
            )
    return (
        f'<pattern id="{pattern_id}" patternUnits="userSpaceOnUse" '
        f'patternContentUnits="userSpaceOnUse" x="{origin_x:.8f}" y="{origin_y:.8f}" '
        f'width="{period_w:.8f}" height="{period_h:.8f}">'
        f'{"".join(cells)}'
        '</pattern>'
    )

_image_pattern_definition.__module__ = 'pptx2html.renderer.html_renderer'
_image_pattern_definition.__qualname__ = 'HtmlRenderer._image_pattern_definition'
