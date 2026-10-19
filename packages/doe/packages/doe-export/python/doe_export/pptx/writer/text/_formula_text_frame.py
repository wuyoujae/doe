# Origin: pptx2html/server/pptx_writer.py::_formula_text_frame
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.text._plain_text_frame import _plain_text_frame

def _formula_text_frame(formula: dict[str, Any]) -> dict[str, Any]:
    return _plain_text_frame(formula.get("fallback_text") or formula.get("source") or "")

_formula_text_frame.__module__ = 'pptx2html.server.pptx_writer'
