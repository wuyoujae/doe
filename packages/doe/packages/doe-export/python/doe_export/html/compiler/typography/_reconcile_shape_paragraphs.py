# Origin: pptx2html/htmlir/compiler.py::_reconcile_shape_paragraphs
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Shape
from doe_export.html.compiler.shared import BulletInfo, CSS_PX_TO_PT, dataclasses
from doe_export.html.compiler.typography._canonical_paragraph_is_rendered import _canonical_paragraph_is_rendered
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.structure._shape_descendant_nodes import _shape_descendant_nodes

def _reconcile_shape_paragraphs(
    shape: Shape,
    root_node: dict[str, Any],
    nodes: list[dict[str, Any]],
    shape_paths: set[str],
) -> bool:
    if shape.text is None:
        return True
    paragraph_nodes = []
    for node in _shape_descendant_nodes(root_node, nodes, shape_paths):
        attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
        if "pptx-paragraph" in str(attrs.get("class") or "").split():
            paragraph_nodes.append(node)
    paragraph_indices = [
        index
        for index, paragraph in enumerate(shape.text.paragraphs)
        if _canonical_paragraph_is_rendered(paragraph)
    ]
    if len(paragraph_nodes) != len(paragraph_indices):
        return False
    metrics_changed = False
    for paragraph_index, node in zip(paragraph_indices, paragraph_nodes, strict=True):
        paragraph = shape.text.paragraphs[paragraph_index]
        before = dataclasses.asdict(paragraph)
        computed = _computed(node)
        alignment = str(computed.get("textAlign") or "").strip().lower()
        paragraph.alignment = {
            "left": "l",
            "start": "l",
            "center": "ctr",
            "right": "r",
            "end": "r",
            "justify": "just",
        }.get(alignment, paragraph.alignment)
        line_height = str(computed.get("lineHeight") or "").strip().lower()
        if line_height and line_height != "normal":
            line_height_px = _css_px(line_height)
            if line_height_px > 0:
                paragraph.line_spacing_pt = line_height_px * CSS_PX_TO_PT
                paragraph.line_spacing_type = "points"
                paragraph.line_spacing_multiple = None
        margin_top = _css_px(computed.get("marginTop"))
        margin_bottom = _css_px(computed.get("marginBottom"))
        padding_top = _css_px(computed.get("paddingTop"))
        padding_bottom = _css_px(computed.get("paddingBottom"))
        paragraph.spacing_before = (margin_top + padding_top) * CSS_PX_TO_PT
        paragraph.spacing_after = (margin_bottom + padding_bottom) * CSS_PX_TO_PT
        paragraph.spacing_before_type = "points"
        paragraph.spacing_after_type = "points"
        paragraph.spacing_before_pct = None
        paragraph.spacing_after_pct = None
        paragraph.margin_left = (
            _css_px(computed.get("marginLeft"))
            + _css_px(computed.get("paddingLeft"))
        ) * CSS_PX_TO_PT
        paragraph.margin_right = (
            _css_px(computed.get("marginRight"))
            + _css_px(computed.get("paddingRight"))
        ) * CSS_PX_TO_PT
        paragraph.indent = _css_px(computed.get("textIndent")) * CSS_PX_TO_PT
        direction = str(computed.get("direction") or "").strip().lower()
        if direction in {"ltr", "rtl"}:
            paragraph.rtl = direction == "rtl"
        writing_mode = str(computed.get("writingMode") or "").strip().lower()
        if writing_mode.startswith("vertical"):
            shape.text.vertical_text = "vert"
        elif writing_mode.startswith("horizontal"):
            shape.text.vertical_text = None
        list_style = str(computed.get("listStyleType") or "").strip().lower()
        if list_style:
            if list_style == "none":
                paragraph.bullet = BulletInfo(kind="none")
            elif list_style in {
                "decimal",
                "decimal-leading-zero",
                "lower-alpha",
                "upper-alpha",
                "lower-roman",
                "upper-roman",
            }:
                scheme = {
                    "lower-alpha": "alphaLcPeriod",
                    "upper-alpha": "alphaUcPeriod",
                    "lower-roman": "romanLcPeriod",
                    "upper-roman": "romanUcPeriod",
                }.get(list_style, "arabicPeriod")
                paragraph.bullet = BulletInfo(
                    kind="auto",
                    auto_number_scheme=scheme,
                    start_at=(
                        paragraph.bullet.start_at
                        if paragraph.bullet is not None
                        else 1
                    ),
                )
            elif list_style in {"disc", "circle", "square"}:
                paragraph.bullet = BulletInfo(
                    kind="char",
                    char={"disc": "\u2022", "circle": "\u25e6", "square": "\u25aa"}[
                        list_style
                    ],
                )
        if dataclasses.asdict(paragraph) != before:
            metrics_changed = True
    if metrics_changed:
        shape.text.layout_snapshot_dirty = True
    return True

_reconcile_shape_paragraphs.__module__ = 'pptx2html.htmlir.compiler'
