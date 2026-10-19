# Origin: pptx2html/server/pptx_writer.py::_apply_cell_fill
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import has_image_payload
from doe_export.pptx.writer.assets._add_image_part import _add_image_part
from doe_export.pptx.writer.shape._build_blip_fill import _build_blip_fill
from doe_export.pptx.writer.shape._clear_fill_children import _clear_fill_children
from doe_export.pptx.writer.xml._hex_color import _hex_color
from doe_export.pptx.writer.table._insert_table_cell_fill_or_append import _insert_table_cell_fill_or_append

def _apply_cell_fill(cell, fill: dict[str, Any] | None, slide) -> None:
    if (fill or {}).get("type") == "picture":
        image = (fill or {}).get("image") or {}
        if has_image_payload(image):
            rel_id = _add_image_part(slide, image)
            tc_pr = cell._tc.get_or_add_tcPr()
            _clear_fill_children(tc_pr)
            _insert_table_cell_fill_or_append(
                tc_pr,
                _build_blip_fill(rel_id, image, fill_alpha=(fill or {}).get("alpha")),
            )
            return
    color = _hex_color((fill or {}).get("color"))
    if color:
        cell.fill.solid()
        cell.fill.fore_color.rgb = color

_apply_cell_fill.__module__ = 'pptx2html.server.pptx_writer'
