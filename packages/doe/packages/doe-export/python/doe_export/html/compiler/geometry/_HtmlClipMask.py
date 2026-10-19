# Origin: pptx2html/htmlir/compiler.py::_HtmlClipMask
from __future__ import annotations
from doe_export.html.compiler.shared import dataclass

@dataclass(frozen=True)
class _HtmlClipMask:
    path: str
    bounds: Bounds
    geometry: str
    geometry_source: str
    geometry_paths: tuple[GeometryPath, ...]
    edge: str = "border-box"

_HtmlClipMask.__module__ = 'pptx2html.htmlir.compiler'
