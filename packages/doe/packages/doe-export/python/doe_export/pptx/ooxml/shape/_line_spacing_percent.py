# Origin: pptx2html/server/ooxml_pptx_writer.py::_line_spacing_percent
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.safe_float import safe_float

def _line_spacing_percent(value: Any) -> ET.Element:
    ln_spc = ET.Element(qn(A, "lnSpc"))
    ET.SubElement(ln_spc, qn(A, "spcPct"), {"val": str(max(0, int(round(safe_float(value, 1.0) * 100000))))})
    return ln_spc

_line_spacing_percent.__module__ = 'pptx2html.server.ooxml_pptx_writer'
