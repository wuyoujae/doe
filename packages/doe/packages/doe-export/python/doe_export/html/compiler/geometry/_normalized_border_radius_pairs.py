# Origin: pptx2html/htmlir/compiler.py::_normalized_border_radius_pairs
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.geometry._border_radius_pairs import _border_radius_pairs

def _normalized_border_radius_pairs(node: dict[str, Any], bounds: Bounds) -> list[tuple[float, float]]:
    radii = _border_radius_pairs(node, bounds)
    if len(radii) != 4:
        return radii
    tl, tr, br, bl = radii
    width = max(0.0, bounds.width)
    height = max(0.0, bounds.height)
    scale = 1.0
    for total, limit in (
        (tl[0] + tr[0], width),
        (bl[0] + br[0], width),
        (tl[1] + bl[1], height),
        (tr[1] + br[1], height),
    ):
        if total > limit > 0:
            scale = min(scale, limit / total)
    if scale < 0.999:
        radii = [(horizontal * scale, vertical * scale) for horizontal, vertical in radii]
    # Only neighbouring radii constrain each other. An asymmetric corner may
    # exceed half the edge (for example a leaf with its opposite corner square).
    return [(max(horizontal, 0.0), max(vertical, 0.0)) for horizontal, vertical in radii]

_normalized_border_radius_pairs.__module__ = 'pptx2html.htmlir.compiler'
