# Origin: pptx2html/htmlir/compiler.py::_browser_rendered_single_line_text
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_column_count import _css_column_count
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.typography._css_vertical_text import _css_vertical_text

def _browser_rendered_single_line_text(
    node: dict[str, Any],
    text: str,
    line_height_pt: float,
    sx: float,
    sy: float,
) -> bool:
    if not str(text or "").strip():
        return False
    raw_text = str(node.get("innerTextRaw") or node.get("visualTextRaw") or "")
    if "\n" in raw_text.strip():
        return False
    for run in node.get("richTextRuns") or []:
        if isinstance(run, dict) and run.get("kind") == "break":
            return False
    computed = _computed(node)
    if _css_column_count(computed) or _css_vertical_text(computed):
        return False
    if line_height_pt <= 0:
        return False
    text_rect = node.get("textRect") if isinstance(node.get("textRect"), dict) else {}
    rect = node.get("rect") if isinstance(node.get("rect"), dict) else {}
    height_px = _css_float(text_rect.get("height"), 0.0) or _css_float(rect.get("height"), 0.0)
    if height_px <= 0:
        return False
    line_box_height = max(height_px * sy, height_px * sx)
    return line_box_height <= max(line_height_pt * 1.55, line_height_pt + 3.0)

_browser_rendered_single_line_text.__module__ = 'pptx2html.htmlir.compiler'
