# Origin: pptx2html/htmlir/compiler.py::_reconcile_table_cell_text
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import TableCell
from doe_export.html.compiler.shared import Shape
from doe_export.html.compiler.typography._reconcile_shape_paragraphs import _reconcile_shape_paragraphs
from doe_export.html.compiler.structure._reconcile_shape_runs import _reconcile_shape_runs

def _reconcile_table_cell_text(
    cell: TableCell,
    cell_node: dict[str, Any],
    nodes: list[dict[str, Any]],
) -> bool:
    if cell.text_frame is None:
        text = cell_node.get("innerTextRaw")
        if isinstance(text, str):
            cell.text = text
        return True
    holder = Shape(text=cell.text_frame)
    if _reconcile_shape_runs(holder, cell_node, nodes, set()) and (
        _reconcile_shape_paragraphs(holder, cell_node, nodes, set())
    ):
        cell.text = cell.text_frame.text
        return True
    semantic_runs = [
        run
        for paragraph in cell.text_frame.paragraphs
        for run in paragraph.runs
        if run.kind != "break"
    ]
    text = cell_node.get("innerTextRaw")
    if len(semantic_runs) == 1 and isinstance(text, str):
        semantic_runs[0].text = text
        cell.text = text
        cell.text_frame.layout_snapshot_dirty = True
        return True
    return False

_reconcile_table_cell_text.__module__ = 'pptx2html.htmlir.compiler'
