# Origin: pptx2html/htmlir/compiler.py::_clip_mask_diagnostics
from __future__ import annotations
from doe_export.html.compiler.geometry._HtmlClipMask import _HtmlClipMask

def _clip_mask_diagnostics(mask: _HtmlClipMask | None, *, adjusted_bounds: bool = False) -> list[str]:
    if mask is None:
        return []
    diagnostics = ["htmlir:overflow-clip-inherited"]
    if mask.edge != "border-box":
        diagnostics.append(f"htmlir:overflow-clip-{mask.edge}")
    if mask.geometry_source == "custom":
        diagnostics.append("htmlir:border-radius-asymmetric")
    if adjusted_bounds:
        diagnostics.append("htmlir:overflow-clip-bounds")
    return diagnostics

_clip_mask_diagnostics.__module__ = 'pptx2html.htmlir.compiler'
