# Origin: pptx2html/server/ooxml_pptx_writer.py::signed_percent_attr
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import OOXML_PERCENT_MAX, OOXML_PERCENT_MIN, math
from doe_export.pptx.ooxml.xml.safe_float import safe_float

def signed_percent_attr(value: Any) -> str:
    number = safe_float(value, 0.0)
    if not math.isfinite(number):
        number = 0.0
    scaled = int(round(number * 100000))
    return str(max(OOXML_PERCENT_MIN, min(OOXML_PERCENT_MAX, scaled)))

signed_percent_attr.__module__ = 'pptx2html.server.ooxml_pptx_writer'
