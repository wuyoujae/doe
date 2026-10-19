# Origin: pptx2html/htmlir/compiler.py::_background_rendered_fractions
from __future__ import annotations
from doe_export.html.compiler.document._background_dimension_fraction import _background_dimension_fraction
from doe_export.html.compiler.css._shadow_tokens import _shadow_tokens

def _background_rendered_fractions(
    size: str,
    natural_size: tuple[float, float] | None,
    box_width_px: float,
    box_height_px: float,
) -> tuple[float, float] | None:
    if box_width_px <= 0 or box_height_px <= 0:
        return None
    if size in {"stretch", "100% 100%"}:
        return 1.0, 1.0
    if natural_size is None:
        return None
    natural_width, natural_height = natural_size
    if natural_width <= 0 or natural_height <= 0:
        return None

    image_aspect = natural_width / natural_height
    box_aspect = box_width_px / box_height_px
    if size == "contain":
        if image_aspect > box_aspect:
            return 1.0, box_aspect / image_aspect
        return image_aspect / box_aspect, 1.0

    tokens = _shadow_tokens(size or "auto")
    if not tokens:
        tokens = ["auto"]
    if len(tokens) == 1:
        tokens.append("auto")
    width = _background_dimension_fraction(tokens[0], box_width_px)
    height = _background_dimension_fraction(tokens[1], box_height_px)
    if width is None and height is None:
        return natural_width / box_width_px, natural_height / box_height_px
    if width is None:
        rendered_height_px = max(0.0, height or 0.0) * box_height_px
        return rendered_height_px * image_aspect / box_width_px, max(0.0, height or 0.0)
    if height is None:
        rendered_width_px = max(0.0, width) * box_width_px
        return max(0.0, width), rendered_width_px / image_aspect / box_height_px
    return max(0.0, width), max(0.0, height)

_background_rendered_fractions.__module__ = 'pptx2html.htmlir.compiler'
