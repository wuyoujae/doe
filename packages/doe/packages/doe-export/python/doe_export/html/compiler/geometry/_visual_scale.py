# Origin: pptx2html/htmlir/compiler.py::_visual_scale
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._css_px import _css_px

def _visual_scale(node: dict[str, Any]) -> float:
    rect = node.get("rect") if isinstance(node.get("rect"), dict) else {}
    layout = node.get("layout") if isinstance(node.get("layout"), dict) else {}
    computed = _computed(node)
    box_model = layout.get("boxModel") if isinstance(layout.get("boxModel"), dict) else {}
    candidates = []
    for rect_key, layout_key, padding_keys, border_keys in (
        (
            "width",
            "offsetWidth",
            ("paddingLeft", "paddingRight"),
            ("borderLeft", "borderRight"),
        ),
        (
            "height",
            "offsetHeight",
            ("paddingTop", "paddingBottom"),
            ("borderTop", "borderBottom"),
        ),
    ):
        rect_value = _css_float(rect.get(rect_key), 0)
        layout_value = _css_px(computed.get(rect_key))
        if layout_value > 0 and str(computed.get("boxSizing") or "").strip().lower() != "border-box":
            layout_value += sum(_css_float(box_model.get(key), 0) for key in padding_keys)
            layout_value += sum(_css_float(box_model.get(key), 0) for key in border_keys)
        if layout_value <= 0:
            layout_value = _css_float(layout.get(layout_key), 0)
        if rect_value > 0 and layout_value > 0:
            candidates.append(rect_value / layout_value)
    candidates = [value for value in candidates if 0.01 <= value <= 100]
    return min(candidates) if candidates else 1.0

_visual_scale.__module__ = 'pptx2html.htmlir.compiler'
