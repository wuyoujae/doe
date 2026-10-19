# Origin: pptx2html/htmlir/compiler.py::_flex_baseline_top_offset
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.document._is_flex_display import _is_flex_display
from doe_export.html.compiler.structure._parent_node import _parent_node
from doe_export.html.compiler.typography._resolved_font_family import _resolved_font_family

def _flex_baseline_top_offset(
    node: dict[str, Any],
    nodes_by_path: dict[str, dict[str, Any]],
    scale_y: float,
) -> float | None:
    parent = _parent_node(node, nodes_by_path)
    if parent is None:
        return None
    parent_computed = _computed(parent)
    computed = _computed(node)
    parent_alignment = str(parent_computed.get("alignItems") or "").strip().lower()
    self_alignment = str(computed.get("alignSelf") or "").strip().lower()
    flex_baseline = _is_flex_display(parent_computed) and (
        "baseline" in parent_alignment or "baseline" in self_alignment
    )
    doe_face = _resolved_font_family(computed) in {
        "MiSans", "MiSans Medium", "Alexandria", "Alexandria Medium",
    }
    if not flex_baseline and not doe_face:
        return None
    layout = node.get("visualTextLayout")
    lines = layout.get("lines") if isinstance(layout, dict) else None
    if not isinstance(lines, list) or not lines or (not doe_face and len(lines) != 1):
        return None
    rect = node.get("rect") if isinstance(node.get("rect"), dict) else {}
    text_rect = node.get("textRect") if isinstance(node.get("textRect"), dict) else {}
    top_overflow_px = _css_float(rect.get("top"), 0.0) - _css_float(
        text_rect.get("top"),
        0.0,
    )
    if top_overflow_px <= 0.25:
        return None
    return round(top_overflow_px * scale_y, 3)

_flex_baseline_top_offset.__module__ = 'pptx2html.htmlir.compiler'
