# Origin: pptx2html/server/ooxml_pptx_writer.py::pt_to_emu
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import EMU_PER_PT

def pt_to_emu(value: Any) -> int:
    try:
        return int(round(float(value) * EMU_PER_PT))
    except (TypeError, ValueError):
        return 0

pt_to_emu.__module__ = 'pptx2html.server.ooxml_pptx_writer'
