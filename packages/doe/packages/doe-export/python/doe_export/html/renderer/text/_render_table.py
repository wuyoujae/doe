# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_table
from __future__ import annotations
from doe_export.html.renderer.shared import Shape, html

def _render_table(self, shape: Shape, base_style: list[str]) -> str:
    table = shape.table
    if not table or not table.rows:
        return self._render_auto_shape(shape, base_style)

    colgroup_html = ""
    if table.col_widths:
        cols = []
        for width in table.col_widths:
            style = f' style="width:{width:.3f}pt"' if width else ""
            cols.append(f"<col{style}>")
        colgroup_html = f"<colgroup>{''.join(cols)}</colgroup>\n"

    rows_html = []
    column_count = max((len(row) for row in table.rows), default=1)
    for row_index, row_cells in enumerate(table.rows):
        tr_style = ""
        if row_index < len(table.row_heights) and table.row_heights[row_index]:
            tr_style = f' style="height:{table.row_heights[row_index]:.3f}pt"'

        cells_html = []
        for column_index, cell in enumerate(row_cells):
            if cell.h_merge or cell.v_merge:
                continue
            attrs = []
            if cell.colspan > 1:
                attrs.append(f'colspan="{int(cell.colspan)}"')
            if cell.rowspan > 1:
                attrs.append(f'rowspan="{int(cell.rowspan)}"')
            cell_width = self._table_cell_width(
                shape,
                table,
                column_index,
                max(1, int(cell.colspan)),
                column_count,
            )
            cell_height = self._table_cell_height(
                shape,
                table,
                row_index,
                max(1, int(cell.rowspan)),
            )
            style = self._table_cell_style(
                cell,
                table,
                row_index,
                width_pt=cell_width,
                height_pt=cell_height,
            )
            if style:
                attrs.append(f'style="{html.escape(style, quote=True)}"')
            attr_text = f" {' '.join(attrs)}" if attrs else ""
            if cell.text_frame:
                text = self._render_text_frame_paragraphs(cell.text_frame)
            else:
                text = html.escape(cell.text or "", quote=False)
            cells_html.append(f"<td{attr_text}>{text}</td>")
        rows_html.append(f"<tr{tr_style}>{''.join(cells_html)}</tr>")

    return (
        f'<div class="pptx-shape" '
        f'style="{self._html_style(base_style)}">\n'
        f'<table class="pptx-table">\n'
        f'{colgroup_html}'
        f'{"".join(rows_html)}\n'
        f'</table>\n'
        f'</div>'
    )

_render_table.__module__ = 'pptx2html.renderer.html_renderer'
_render_table.__qualname__ = 'HtmlRenderer._render_table'
