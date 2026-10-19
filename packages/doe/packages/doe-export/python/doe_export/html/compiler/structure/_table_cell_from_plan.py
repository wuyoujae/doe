# Origin: pptx2html/htmlir/compiler.py::_table_cell_from_plan
from __future__ import annotations
from doe_export.html.compiler.shared import Border
from doe_export.html.compiler.shared import Fill
from doe_export.html.compiler.structure._HtmlTableCellPlan import _HtmlTableCellPlan
from doe_export.html.compiler.shared import SLIDE_HEIGHT, SLIDE_WIDTH, TableCell, make_text_container_metrics
from doe_export.html.compiler.css._border_from_node_side import _border_from_node_side
from doe_export.html.compiler.geometry._bounds_from_node import _bounds_from_node
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.typography._css_text_frame_margins import _css_text_frame_margins
from doe_export.html.compiler.css._fill_from_node import _fill_from_node
from doe_export.html.compiler.browser._set_browser_text_layout_snapshot import _set_browser_text_layout_snapshot
from doe_export.html.compiler.typography._table_cell_text import _table_cell_text
from doe_export.html.compiler.typography._table_cell_text_frame_from_node import _table_cell_text_frame_from_node
from doe_export.html.compiler.structure._table_vertical_align import _table_vertical_align
from doe_export.html.compiler.typography._text_frame_plain_text import _text_frame_plain_text
from doe_export.html.compiler.geometry._visual_scale import _visual_scale

def _table_cell_from_plan(
    plan: _HtmlTableCellPlan,
    *,
    col_count: int,
    row_count: int,
    table_fill: Fill | None,
    table_side_borders: dict[str, Border | None],
    sx: float,
    sy: float,
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> TableCell:
    if plan.h_merge or plan.v_merge:
        return TableCell(h_merge=plan.h_merge, v_merge=plan.v_merge)
    if plan.node is None:
        return TableCell(text="", colspan=1, rowspan=1)

    node = plan.node
    text = _table_cell_text(node)
    text_frame = _table_cell_text_frame_from_node(text, node, sx, sy)
    cell_fill = _fill_from_node(node) or (_fill_from_node(plan.row_node) if plan.row_node else None) or table_fill
    margins = _css_text_frame_margins(_computed(node), _visual_scale(node))
    vertical_align = _table_vertical_align(node)
    border_left = _border_from_node_side(node, "left", sx, sy)
    border_right = _border_from_node_side(node, "right", sx, sy)
    border_top = _border_from_node_side(node, "top", sx, sy)
    border_bottom = _border_from_node_side(node, "bottom", sx, sy)
    if plan.col_index == 0 and border_left is None:
        border_left = table_side_borders.get("left")
    if plan.col_index + plan.colspan >= col_count and border_right is None:
        border_right = table_side_borders.get("right")
    if plan.row_index == 0 and border_top is None:
        border_top = table_side_borders.get("top")
    if plan.row_index + plan.rowspan >= row_count and border_bottom is None:
        border_bottom = table_side_borders.get("bottom")

    cell_bounds = _bounds_from_node(node, sx, sy, canvas_size)
    if cell_bounds is not None and cell_bounds.width > 0 and cell_bounds.height > 0:
        _set_browser_text_layout_snapshot(
            text_frame,
            [(0, node)],
            make_text_container_metrics(
                cell_bounds.width,
                cell_bounds.height,
                kind="table-cell",
                cell_margins=margins,
            ),
        )

    return TableCell(
        text=_text_frame_plain_text(text_frame),
        colspan=plan.colspan,
        rowspan=plan.rowspan,
        text_frame=text_frame,
        fill=cell_fill,
        margins=margins,
        vertical_align=vertical_align,
        border_left=border_left,
        border_right=border_right,
        border_top=border_top,
        border_bottom=border_bottom,
    )

_table_cell_from_plan.__module__ = 'pptx2html.htmlir.compiler'
