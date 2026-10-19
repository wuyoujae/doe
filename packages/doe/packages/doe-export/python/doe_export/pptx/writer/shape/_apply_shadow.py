# Origin: pptx2html/server/pptx_writer.py::_apply_shadow
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shape._shape_sp_pr import _shape_sp_pr
from doe_export.pptx.writer.shape._write_shadow_xml import _write_shadow_xml

def _apply_shadow(pptx_shape, shadow: dict[str, Any] | None) -> None:
    sp_pr = _shape_sp_pr(pptx_shape)
    _write_shadow_xml(sp_pr, shadow)

_apply_shadow.__module__ = 'pptx2html.server.pptx_writer'
