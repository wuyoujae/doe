# Origin: pptx_pipeline.py::_canonical_text_layout_targets
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import CanonicalHtmlRenderer
from doe_export.pipeline.text_layout._shape_text_container_metrics import _shape_text_container_metrics
from doe_export.pipeline.text_layout._text_container_metrics import _text_container_metrics

def _canonical_text_layout_targets(presentation) -> dict[str, tuple[Any, dict[str, Any] | None]]:
    targets: dict[str, tuple[Any, dict[str, Any] | None]] = {}
    for slide_index, slide in enumerate(presentation.slides):
        shape_key = 0

        def visit(shape) -> None:
            nonlocal shape_key
            current_shape_key = shape_key
            shape_key += 1
            prefix = f"slide:{slide_index}:shape:{current_shape_key}"
            if shape.text is not None:
                targets[f"{prefix}:text"] = (
                    shape.text,
                    _shape_text_container_metrics(shape),
                )
            table = shape.table
            if table is not None:
                column_count = max((len(row) for row in table.rows), default=1)
                for row_index, row_cells in enumerate(table.rows):
                    for column_index, cell in enumerate(row_cells):
                        if cell.h_merge or cell.v_merge or cell.text_frame is None:
                            continue
                        width = CanonicalHtmlRenderer._table_cell_width(
                            shape,
                            table,
                            column_index,
                            max(1, int(cell.colspan)),
                            column_count,
                        )
                        height = CanonicalHtmlRenderer._table_cell_height(
                            shape,
                            table,
                            row_index,
                            max(1, int(cell.rowspan)),
                        )
                        targets[f"{prefix}:cell:{row_index}:{column_index}"] = (
                            cell.text_frame,
                            _text_container_metrics(
                                width,
                                height,
                                kind="table-cell",
                                cell_margins=cell.margins,
                            ),
                        )
            for child in shape.shapes or []:
                visit(child)

        for shape in slide.shapes:
            visit(shape)
    return targets

_canonical_text_layout_targets.__module__ = 'pptx_pipeline'
