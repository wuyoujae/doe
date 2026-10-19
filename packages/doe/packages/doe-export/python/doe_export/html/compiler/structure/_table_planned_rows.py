# Origin: pptx2html/htmlir/compiler.py::_table_planned_rows
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import TABLE_CELL_TAGS, _parent_path
from doe_export.html.compiler.structure._HtmlTableCellPlan import _HtmlTableCellPlan
from doe_export.html.compiler.structure._belongs_to_table import _belongs_to_table
from doe_export.html.compiler.document._html_span import _html_span
from doe_export.html.compiler.document._parent_path import _parent_path

def _table_planned_rows(
    row_nodes: list[dict[str, Any]],
    nodes: list[dict[str, Any]],
    table_path: str,
    table_paths: list[str],
) -> list[list[_HtmlTableCellPlan]]:
    rows: list[list[_HtmlTableCellPlan]] = []
    active_rowspans: dict[int, int] = {}

    for row_index, row_node in enumerate(row_nodes):
        row_path = str(row_node.get("path") or "")
        cell_nodes = [
            node
            for node in nodes
            if str(node.get("tag") or "").lower() in TABLE_CELL_TAGS
            and bool(node.get("visible"))
            and _belongs_to_table(str(node.get("path") or ""), table_path, table_paths)
            and _parent_path(str(node.get("path") or "")) == row_path
        ]
        row: list[_HtmlTableCellPlan] = []
        col_index = 0

        def append_active_or_blank_until(target_col: int | None = None) -> None:
            nonlocal col_index
            while True:
                if active_rowspans.get(col_index, 0) > 0:
                    row.append(
                        _HtmlTableCellPlan(
                            node=None,
                            row_node=row_node,
                            row_index=row_index,
                            col_index=col_index,
                            v_merge=True,
                        )
                    )
                    active_rowspans[col_index] -= 1
                    if active_rowspans[col_index] <= 0:
                        active_rowspans.pop(col_index, None)
                    col_index += 1
                    continue
                if target_col is not None and col_index < target_col:
                    row.append(_HtmlTableCellPlan(node=None, row_node=row_node, row_index=row_index, col_index=col_index))
                    col_index += 1
                    continue
                break

        for cell_node in cell_nodes:
            append_active_or_blank_until()
            colspan = _html_span(cell_node, "colspan", default=1, maximum=1000)
            raw_rowspan = _html_span(cell_node, "rowspan", default=1, maximum=65534, allow_zero=True)
            rowspan = max(1, len(row_nodes) - row_index) if raw_rowspan == 0 else raw_rowspan
            rowspan = max(1, min(rowspan, len(row_nodes) - row_index))
            row.append(
                _HtmlTableCellPlan(
                    node=cell_node,
                    row_node=row_node,
                    row_index=row_index,
                    col_index=col_index,
                    colspan=colspan,
                    rowspan=rowspan,
                )
            )
            if rowspan > 1:
                for offset in range(colspan):
                    active_rowspans[col_index + offset] = max(active_rowspans.get(col_index + offset, 0), rowspan - 1)
            for offset in range(1, colspan):
                row.append(
                    _HtmlTableCellPlan(
                        node=None,
                        row_node=row_node,
                        row_index=row_index,
                        col_index=col_index + offset,
                        h_merge=True,
                    )
                )
            col_index += colspan

        while active_rowspans:
            append_active_or_blank_until()
            future_cols = [col for col, remaining in active_rowspans.items() if remaining > 0 and col > col_index]
            if not future_cols:
                break
            append_active_or_blank_until(min(future_cols))

        rows.append(row)

    col_count = max((len(row) for row in rows), default=0)
    for row_index, row in enumerate(rows):
        row_node = row_nodes[row_index] if row_index < len(row_nodes) else None
        while len(row) < col_count:
            row.append(
                _HtmlTableCellPlan(
                    node=None,
                    row_node=row_node,
                    row_index=row_index,
                    col_index=len(row),
                )
            )
    return rows

_table_planned_rows.__module__ = 'pptx2html.htmlir.compiler'
