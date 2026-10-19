# Origin: pptx2html/htmlir/compiler.py::_svg_text_shape
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Border, Bounds, CSS_PX_TO_PT, Fill, Paragraph, Run, Shape, TextFrame
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.typography._font_from_node import _font_from_node
from doe_export.html.compiler.structure._shape_name import _shape_name

def _svg_text_shape(node: dict[str, Any], sx: float, sy: float, shape_id: int) -> Shape | None:
    measured = node.get("svgText")
    if not isinstance(measured, dict):
        return None
    text = str(node.get("visualTextRaw") or node.get("directText") or "")
    if not text.strip():
        return None
    scale = float(measured["scaleY"])
    width = float(measured["width"]) * sx
    height = float(measured["height"]) * sy
    center = measured["center"]
    bounds = Bounds(float(center["x"]) * sx - width / 2, float(center["y"]) * sy - height / 2, width, height)
    computed = dict(_computed(node))
    computed["color"] = computed.get("fill") or computed.get("color")
    runs = []
    for record in node.get("richTextRuns") or []:
        if record.get("kind") != "text":
            continue
        style = {**computed, **record.get("computed", {})}
        style["color"] = computed["color"]
        font = _font_from_node(
            {"computed": style, "effectiveOpacity": measured.get("opacity", 1)}, (_css_px(style.get("fontSize")) or 16) * scale * sy,
            visual_scale=scale * sx / CSS_PX_TO_PT,
        )
        runs.append(Run(text=record["text"], kind="text", font=font))
    if not runs:
        return None
    return Shape(
        type="auto_shape", name=_shape_name(node, "SVG text"), shape_id=shape_id,
        bounds=bounds, rotation=float(measured["rotation"]), geometry="rect",
        fill=Fill(type="none"), border=Border(no_fill=True),
        text=TextFrame(
            vertical_align="top", word_wrap=False, margins={"left": 0, "right": 0, "top": 0, "bottom": 0},
            autofit_mode="none", paragraphs=[Paragraph(alignment="left", runs=runs)],
        ),
        diagnostics=["htmlir:svg-text"],
    )

_svg_text_shape.__module__ = 'pptx2html.htmlir.compiler'
