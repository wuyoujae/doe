# Origin: pptx2html/htmlir/compiler.py::_presentation_text_layout_entries
from __future__ import annotations
from doe_export.html.compiler.shared import Presentation
from doe_export.html.compiler.shared import make_text_container_metrics
from doe_export.html.compiler.structure._iter_ir_shapes import _iter_ir_shapes
from doe_export.html.compiler.document._validated_layout_track_sizes import _validated_layout_track_sizes

def _presentation_text_layout_entries(
    presentation: Presentation,
):
    for slide_index, slide in enumerate(presentation.slides):
        for shape_key, shape in enumerate(_iter_ir_shapes(slide.shapes)):
            if shape.text is not None and shape.bounds is not None:
                width = shape.bounds.width
                height = shape.bounds.height
                if shape.text_rect is not None:
                    width *= max(0.0, shape.text_rect.right - shape.text_rect.left) / 100.0
                    height *= max(0.0, shape.text_rect.bottom - shape.text_rect.top) / 100.0
                if width > 0 and height > 0:
                    yield (
                        f"slide:{slide_index}:shape:{shape_key}:text",
                        shape.text,
                        make_text_container_metrics(width, height),
                    )
            if shape.table is None or shape.bounds is None:
                continue
            rows = shape.table.rows
            row_count = len(rows)
            col_count = max((len(row) for row in rows), default=0)
            if row_count <= 0 or col_count <= 0:
                continue
            col_widths = _validated_layout_track_sizes(shape.table.col_widths, col_count)
            row_heights = _validated_layout_track_sizes(shape.table.row_heights, row_count)
            if col_widths is None or row_heights is None:
                continue
            for row_index, row in enumerate(rows):
                for column_index, cell in enumerate(row):
                    if cell.h_merge or cell.v_merge or cell.text_frame is None:
                        continue
                    colspan = max(1, int(cell.colspan or 1))
                    rowspan = max(1, int(cell.rowspan or 1))
                    width = sum(col_widths[column_index : min(col_count, column_index + colspan)])
                    height = sum(row_heights[row_index : min(row_count, row_index + rowspan)])
                    if width <= 0 or height <= 0:
                        continue
                    yield (
                        f"slide:{slide_index}:shape:{shape_key}:cell:{row_index}:{column_index}",
                        cell.text_frame,
                        make_text_container_metrics(
                            width,
                            height,
                            kind="table-cell",
                            cell_margins=cell.margins,
                        ),
                    )

_presentation_text_layout_entries.__module__ = 'pptx2html.htmlir.compiler'
