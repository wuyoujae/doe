# Origin: pptx2html/htmlir/compiler.py::_table_col_widths
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.structure._HtmlTableCellPlan import _HtmlTableCellPlan
from doe_export.html.compiler.shared import SLIDE_HEIGHT, SLIDE_WIDTH
from doe_export.html.compiler.structure._belongs_to_table import _belongs_to_table
from doe_export.html.compiler.geometry._bounds_from_node import _bounds_from_node
from doe_export.html.compiler.document._html_span import _html_span
from doe_export.html.compiler.document._normalized_track_sizes import _normalized_track_sizes
from doe_export.html.compiler.structure._table_col_declared_width import _table_col_declared_width

def _table_col_widths(
    table_node: dict[str, Any],
    nodes: list[dict[str, Any]],
    table_path: str,
    table_paths: list[str],
    planned_rows: list[list[_HtmlTableCellPlan]],
    table_bounds: Bounds,
    sx: float,
    sy: float,
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> list[float]:
    col_count = max((len(row) for row in planned_rows), default=0)
    if col_count <= 0:
        return []
    declared: list[float | None] = [None] * col_count
    col_index = 0
    col_nodes = [
        node
        for node in nodes
        if str(node.get("tag") or "").lower() == "col"
        and _belongs_to_table(str(node.get("path") or ""), table_path, table_paths)
    ]
    for col_node in col_nodes:
        if col_index >= col_count:
            break
        span = _html_span(col_node, "span", default=1, maximum=1000)
        width, width_source = _table_col_declared_width(col_node, table_bounds.width, sx)
        if width is not None and span > 1 and width_source == "computed":
            width = width / span
        for _ in range(span):
            if col_index >= col_count:
                break
            declared[col_index] = width
            col_index += 1

    inferred: list[float | None] = [None] * col_count
    for row in planned_rows:
        for plan in row:
            if plan.node is None or plan.h_merge or plan.v_merge:
                continue
            bounds = _bounds_from_node(plan.node, sx, sy, canvas_size)
            if bounds is None or bounds.width <= 0:
                continue
            per_col = bounds.width / max(1, plan.colspan)
            for offset in range(plan.colspan):
                target = plan.col_index + offset
                if target >= col_count:
                    break
                inferred[target] = max(inferred[target] or 0.0, per_col)

    values = [declared[index] if declared[index] is not None else inferred[index] for index in range(col_count)]
    return _normalized_track_sizes(values, table_bounds.width)

_table_col_widths.__module__ = 'pptx2html.htmlir.compiler'
