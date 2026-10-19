# Origin: pptx2html/server/pptx_writer.py::_pt_to_emu
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _pt_to_emu(value: Any) -> int:
    return int(round(float(value or 0) * 12700))

_pt_to_emu.__module__ = 'pptx2html.server.pptx_writer'
