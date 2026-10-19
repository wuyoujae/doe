# Origin: pptx2html/server/pptx_writer.py::_table_cell_border_xml
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._append_srgb import _append_srgb
from doe_export.pptx.writer.xml._clean_hex import _clean_hex
from doe_export.pptx.writer.xml._pt_to_emu import _pt_to_emu

def _table_cell_border_xml(tag: str, border: dict[str, Any] | None):
    if not border or border.get("no_fill"):
        line = OxmlElement(tag)
        line.append(OxmlElement("a:noFill"))
        return line
    line = OxmlElement(tag)
    width = border.get("width")
    if width:
        line.set("w", str(_pt_to_emu(width)))
    color = _clean_hex(border.get("color"))
    if color:
        solid_fill = OxmlElement("a:solidFill")
        _append_srgb(solid_fill, color, border.get("alpha"))
        line.append(solid_fill)
    else:
        line.append(OxmlElement("a:noFill"))
    dash = border.get("dash")
    if dash and dash != "solid":
        dash_xml = OxmlElement("a:prstDash")
        dash_xml.set("val", str(dash))
        line.append(dash_xml)
    return line

_table_cell_border_xml.__module__ = 'pptx2html.server.pptx_writer'
