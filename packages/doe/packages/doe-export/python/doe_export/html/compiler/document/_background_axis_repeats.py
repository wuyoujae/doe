# Origin: pptx2html/htmlir/compiler.py::_background_axis_repeats
from __future__ import annotations

def _background_axis_repeats(mode: str, rendered_fraction: float) -> bool:
    if mode == "no-repeat" or rendered_fraction >= 1.0 - 1e-6:
        return False
    if mode == "space":
        return rendered_fraction * 2.0 <= 1.0 + 1e-6
    return mode in {"repeat", "round"}

_background_axis_repeats.__module__ = 'pptx2html.htmlir.compiler'
