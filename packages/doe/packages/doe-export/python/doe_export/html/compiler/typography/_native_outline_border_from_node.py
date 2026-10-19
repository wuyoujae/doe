# Origin: pptx2html/htmlir/compiler.py::_native_outline_border_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Border
from doe_export.html.compiler.css._border_side_specs import _border_side_specs

def _native_outline_border_from_node(node: dict[str, Any], sx: float, sy: float) -> Border | None:
    specs = _border_side_specs(node, sx, sy)
    if len(specs) != 4:
        return None
    first = specs[0]
    for spec in specs[1:]:
        if abs(spec["outline_width_pt"] - first["outline_width_pt"]) > 0.05:
            return None
        if spec["color"] != first["color"]:
            return None
        if abs(spec["alpha"] - first["alpha"]) > 0.01:
            return None
        if spec["dash"] != first["dash"] or spec["compound"] != first["compound"]:
            return None
    alpha = first["alpha"]
    return Border(
        width=round(first["outline_width_pt"], 3),
        color=first["color"],
        alpha=alpha if alpha < 0.999 else None,
        dash=first["dash"],
        compound=first["compound"],
    )

_native_outline_border_from_node.__module__ = 'pptx2html.htmlir.compiler'
