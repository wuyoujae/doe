# Origin: pptx2html/server/pptx_writer.py::_apply_table_cell_properties
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import Pt
from doe_export.pptx.writer.shape._insert_before_fill_or_append import _insert_before_fill_or_append
from doe_export.pptx.writer.xml._pt_to_emu import _pt_to_emu
from doe_export.pptx.writer.xml._remove_children import _remove_children
from doe_export.pptx.writer.table._table_cell_border_xml import _table_cell_border_xml
from doe_export.pptx.writer.table._table_vertical_anchor import _table_vertical_anchor
from doe_export.pptx.writer.xml._vertical_anchor import _vertical_anchor

def _apply_table_cell_properties(cell, cell_ir: dict[str, Any]) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    margins = cell_ir.get("margins") or {}
    for key, attr in (("left", "marL"), ("right", "marR"), ("top", "marT"), ("bottom", "marB")):
        if margins.get(key) is None:
            continue
        value = Pt(float(margins.get(key) or 0))
        try:
            setattr(cell, f"margin_{key}", value)
        except AttributeError:
            pass
        tc_pr.set(attr, str(_pt_to_emu(margins.get(key))))

    vertical_align = cell_ir.get("vertical_align")
    if vertical_align:
        try:
            cell.vertical_anchor = _vertical_anchor(vertical_align)
        except AttributeError:
            pass
        tc_pr.set("anchor", _table_vertical_anchor(vertical_align))

    _remove_children(tc_pr, ("a:lnL", "a:lnR", "a:lnT", "a:lnB"))
    for key, tag in (
        ("border_left", "a:lnL"),
        ("border_right", "a:lnR"),
        ("border_top", "a:lnT"),
        ("border_bottom", "a:lnB"),
    ):
        border_xml = _table_cell_border_xml(tag, cell_ir.get(key))
        if border_xml is not None:
            _insert_before_fill_or_append(tc_pr, border_xml)

_apply_table_cell_properties.__module__ = 'pptx2html.server.pptx_writer'
