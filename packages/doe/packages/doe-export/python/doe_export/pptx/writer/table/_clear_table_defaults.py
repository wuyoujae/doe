# Origin: pptx2html/server/pptx_writer.py::_clear_table_defaults
from __future__ import annotations
from doe_export.pptx.writer.shared import qn
from doe_export.pptx.writer.xml._first_xml_descendant import _first_xml_descendant
from doe_export.pptx.writer.xml._remove_children import _remove_children

def _clear_table_defaults(table_shape) -> None:
    table_xml = _first_xml_descendant(table_shape._element, "a:tbl")
    if table_xml is None:
        return
    tbl_pr = table_xml.find(qn("a:tblPr"))
    if tbl_pr is None:
        return
    for attr in ("firstRow", "firstCol", "lastRow", "lastCol", "bandRow", "bandCol"):
        tbl_pr.attrib.pop(attr, None)
    _remove_children(tbl_pr, ("a:tableStyleId",))

_clear_table_defaults.__module__ = 'pptx2html.server.pptx_writer'
