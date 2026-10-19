# Origin: pptx2html/htmlir/compiler.py::_path_has_segment
from __future__ import annotations
from doe_export.html.compiler.document._path_segment_tag import _path_segment_tag

def _path_has_segment(path: str, tag: str) -> bool:
    return any(_path_segment_tag(segment) == tag for segment in path.split(" > "))

_path_has_segment.__module__ = 'pptx2html.htmlir.compiler'
