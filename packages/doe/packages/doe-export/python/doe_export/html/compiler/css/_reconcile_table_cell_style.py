# Origin: pptx2html/htmlir/compiler.py::_reconcile_table_cell_style
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import TableCell
from doe_export.html.compiler.shared import Border, Bounds, CSS_PX_TO_PT, Fill
from doe_export.html.compiler.css._background_fills_from_node import _background_fills_from_node
from doe_export.html.compiler.typography._border_style_to_line import _border_style_to_line
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._css_px import _css_px

def _reconcile_table_cell_style(
    cell: TableCell,
    node: dict[str, Any],
) -> None:
    rect = node.get("rect") if isinstance(node.get("rect"), dict) else {}
    bounds = Bounds(
        0.0,
        0.0,
        max(0.0, _css_float(rect.get("width"), 0.0) * CSS_PX_TO_PT),
        max(0.0, _css_float(rect.get("height"), 0.0) * CSS_PX_TO_PT),
    )
    fills = _background_fills_from_node(node, bounds)
    computed = _computed(node)
    if fills:
        cell.fill = fills[-1]
    elif str(computed.get("backgroundColor") or "").strip().lower() in {
        "transparent",
        "rgba(0, 0, 0, 0)",
    }:
        cell.fill = Fill(type="none")
    cell.margins = {
        "top": _css_px(computed.get("paddingTop")) * CSS_PX_TO_PT,
        "right": _css_px(computed.get("paddingRight")) * CSS_PX_TO_PT,
        "bottom": _css_px(computed.get("paddingBottom")) * CSS_PX_TO_PT,
        "left": _css_px(computed.get("paddingLeft")) * CSS_PX_TO_PT,
    }
    vertical = str(computed.get("verticalAlign") or "").strip().lower()
    if vertical in {"middle", "center"}:
        cell.vertical_align = "ctr"
    elif vertical in {"bottom"}:
        cell.vertical_align = "bot"
    elif vertical in {"top"}:
        cell.vertical_align = "top"
    for side in ("left", "right", "top", "bottom"):
        style = str(
            computed.get(f"border{side.title()}Style") or ""
        ).strip().lower()
        width = _css_px(computed.get(f"border{side.title()}Width"))
        color = _css_color(computed.get(f"border{side.title()}Color"))
        field = f"border_{side}"
        if style in {"none", "hidden"} or width <= 0 or color is None:
            setattr(cell, field, Border(no_fill=True))
            continue
        dash, compound = _border_style_to_line(style)
        setattr(
            cell,
            field,
            Border(
                width=width * CSS_PX_TO_PT,
                color=color[0],
                alpha=color[1] if color[1] < 0.999 else None,
                dash=dash,
                compound=compound,
                no_fill=False,
            ),
        )

_reconcile_table_cell_style.__module__ = 'pptx2html.htmlir.compiler'
