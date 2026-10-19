# Origin: pptx2html/htmlir/compiler.py::_table_shape_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Border, Bounds, Fill, SLIDE_HEIGHT, SLIDE_WIDTH, Shape, TableInfo
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.structure._belongs_to_table import _belongs_to_table
from doe_export.html.compiler.css._border_from_node_side import _border_from_node_side
from doe_export.html.compiler.geometry._bounds_from_node import _bounds_from_node
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.css._fill_from_node import _fill_from_node
from doe_export.html.compiler.geometry._relative_bounds import _relative_bounds
from doe_export.html.compiler.structure._shape_name import _shape_name
from doe_export.html.compiler.structure._table_caption_node import _table_caption_node
from doe_export.html.compiler.structure._table_cell_from_plan import _table_cell_from_plan
from doe_export.html.compiler.typography._table_cell_text import _table_cell_text
from doe_export.html.compiler.structure._table_col_widths import _table_col_widths
from doe_export.html.compiler.geometry._table_content_bounds import _table_content_bounds
from doe_export.html.compiler.structure._table_first_row_is_header import _table_first_row_is_header
from doe_export.html.compiler.structure._table_last_row_is_footer import _table_last_row_is_footer
from doe_export.html.compiler.structure._table_planned_rows import _table_planned_rows
from doe_export.html.compiler.structure._table_row_heights import _table_row_heights
from doe_export.html.compiler.structure._table_row_nodes import _table_row_nodes
from doe_export.html.compiler.typography._text_frame_from_node import _text_frame_from_node
from doe_export.html.compiler.geometry._union_bounds import _union_bounds

def _table_shape_from_node(
    table_node: dict[str, Any],
    nodes: list[dict[str, Any]],
    nodes_by_path: dict[str, dict[str, Any]],
    sx: float,
    sy: float,
    start_shape_id: int,
    diagnostics: list[HtmlDiagnostic],
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> tuple[Shape | None, int]:
    table_path = str(table_node.get("path") or "")
    table_bounds = _bounds_from_node(table_node, sx, sy, canvas_size)
    if not table_path or table_bounds is None:
        return None, start_shape_id

    table_paths = [str(node.get("path") or "") for node in nodes if str(node.get("tag") or "").lower() == "table"]
    row_nodes = _table_row_nodes(table_path, nodes, table_paths)
    if not row_nodes:
        diagnostics.append(
            HtmlDiagnostic(
                "warning",
                "htmlir-empty-table",
                "HTML <table> has no visible table rows to map into editable TableInfo.",
                tag="table",
            )
        )
        return None, start_shape_id

    table_bounds = _table_content_bounds(row_nodes, sx, sy, canvas_size) or table_bounds
    planned_rows = _table_planned_rows(row_nodes, nodes, table_path, table_paths)
    if not planned_rows:
        return None, start_shape_id
    col_count = max((len(row) for row in planned_rows), default=0)
    if col_count <= 0:
        return None, start_shape_id

    table_fill = _fill_from_node(table_node)
    table_side_borders = {side: _border_from_node_side(table_node, side, sx, sy) for side in ("left", "right", "top", "bottom")}
    row_count = len(planned_rows)
    table_rows = [
        [
            _table_cell_from_plan(
                plan,
                col_count=col_count,
                row_count=row_count,
                table_fill=table_fill,
                table_side_borders=table_side_borders,
                sx=sx,
                sy=sy,
                canvas_size=canvas_size,
            )
            for plan in row
        ]
        for row in planned_rows
    ]
    col_widths = _table_col_widths(
        table_node,
        nodes,
        table_path,
        table_paths,
        planned_rows,
        table_bounds,
        sx,
        sy,
        canvas_size,
    )
    row_heights = _table_row_heights(row_nodes, table_bounds, sx, sy, canvas_size)

    shape_id = start_shape_id
    caption_node = _table_caption_node(table_path, nodes, table_paths)
    caption_shape: Shape | None = None
    caption_bounds: Bounds | None = None
    if caption_node is not None:
        caption_text = _table_cell_text(caption_node)
        caption_bounds = _bounds_from_node(caption_node, sx, sy, canvas_size)
        if caption_text and caption_bounds and caption_bounds.width > 0.25 and caption_bounds.height > 0.25:
            caption_shape = Shape(
                type="auto_shape",
                name=_shape_name(caption_node, "table caption"),
                shape_id=shape_id,
                bounds=caption_bounds,
                geometry="rect",
                geometry_source="preset",
                fill=Fill(type="none"),
                border=Border(no_fill=True),
                text=_text_frame_from_node(
                    caption_text,
                    caption_node,
                    sx,
                    sy,
                    container_bounds=caption_bounds,
                ),
                diagnostics=["htmlir:table-caption"],
            )
            shape_id += 1

    table_diagnostics = ["htmlir:table"]
    if any(node for node in nodes if str(node.get("tag") or "").lower() == "col" and _belongs_to_table(str(node.get("path") or ""), table_path, table_paths)):
        table_diagnostics.append("htmlir:table-colgroup")
    if any(plan.colspan > 1 or plan.rowspan > 1 for row in planned_rows for plan in row if not plan.h_merge and not plan.v_merge):
        table_diagnostics.append("htmlir:table-spans")
    computed = _computed(table_node)
    border_collapse = str(computed.get("borderCollapse") or "").strip().lower()
    if border_collapse == "collapse":
        table_diagnostics.append("htmlir:table-border-collapse")
    if border_collapse != "collapse" and _css_px(str(computed.get("borderSpacing") or "").split(" ", 1)[0]) > 0:
        table_diagnostics.append("htmlir:table-border-spacing-first-pass")

    table_shape = Shape(
        type="graphic_frame",
        name=_shape_name(table_node, "table"),
        shape_id=shape_id,
        bounds=table_bounds,
        fill=Fill(type="none"),
        border=Border(no_fill=True),
        table=TableInfo(
            rows=table_rows,
            col_widths=col_widths,
            row_heights=row_heights,
            first_row=_table_first_row_is_header(planned_rows),
            last_row=_table_last_row_is_footer(planned_rows),
            band_row=False,
        ),
        diagnostics=table_diagnostics,
    )
    shape_id += 1

    if caption_shape is None or caption_bounds is None:
        return table_shape, shape_id

    group_bounds = _union_bounds([caption_bounds, table_bounds]) or table_bounds
    caption_shape.bounds = _relative_bounds(caption_bounds, group_bounds)
    table_shape.bounds = _relative_bounds(table_bounds, group_bounds)
    group = Shape(
        type="group_shape",
        name=_shape_name(table_node, "table group"),
        shape_id=shape_id,
        bounds=group_bounds,
        group_bounds=Bounds(0.0, 0.0, group_bounds.width, group_bounds.height),
        shapes=[caption_shape, table_shape],
        diagnostics=["htmlir:table-group"],
    )
    shape_id += 1
    return group, shape_id

_table_shape_from_node.__module__ = 'pptx2html.htmlir.compiler'
