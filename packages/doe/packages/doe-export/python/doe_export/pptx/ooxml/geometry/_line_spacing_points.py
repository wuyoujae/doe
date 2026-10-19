# Origin: pptx2html/server/ooxml_pptx_writer.py::_line_spacing_points
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.safe_float import safe_float

def _line_spacing_points(value: Any) -> ET.Element:
    ln_spc = ET.Element(qn(A, "lnSpc"))
    ET.SubElement(ln_spc, qn(A, "spcPts"), {"val": str(max(1, int(round(safe_float(value, 0.0) * 100))))})
    return ln_spc

_line_spacing_points.__module__ = 'pptx2html.server.ooxml_pptx_writer'
