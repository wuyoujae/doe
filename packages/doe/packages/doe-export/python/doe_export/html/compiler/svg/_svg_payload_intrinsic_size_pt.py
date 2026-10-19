# Origin: pptx2html/htmlir/compiler.py::_svg_payload_intrinsic_size_pt
from __future__ import annotations
from doe_export.html.compiler.shared import CSS_PX_TO_PT, re
from doe_export.html.compiler.svg._svg_css_length_pt import _svg_css_length_pt

def _svg_payload_intrinsic_size_pt(payload: bytes) -> tuple[float, float] | None:
    try:
        text = payload.decode("utf-8-sig")
    except UnicodeDecodeError:
        return None
    tag_match = re.search(r"<svg\b[^>]*>", text, flags=re.IGNORECASE)
    if tag_match is None:
        return None
    tag = tag_match.group(0)

    def attr(name: str) -> str | None:
        match = re.search(rf"\s{name}\s*=\s*(['\"])(.*?)\1", tag, flags=re.IGNORECASE)
        return match.group(2) if match is not None else None

    width = _svg_css_length_pt(attr("width"))
    height = _svg_css_length_pt(attr("height"))
    if width is not None and height is not None:
        return width, height
    view_box = attr("viewBox")
    if view_box:
        try:
            parts = [float(value) for value in re.split(r"[\s,]+", view_box.strip()) if value]
        except ValueError:
            parts = []
        if len(parts) == 4 and parts[2] > 0 and parts[3] > 0:
            return width or parts[2] * CSS_PX_TO_PT, height or parts[3] * CSS_PX_TO_PT
    return None

_svg_payload_intrinsic_size_pt.__module__ = 'pptx2html.htmlir.compiler'
