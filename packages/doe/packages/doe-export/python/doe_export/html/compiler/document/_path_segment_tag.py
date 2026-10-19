# Origin: pptx2html/htmlir/compiler.py::_path_segment_tag
from __future__ import annotations
from doe_export.html.compiler.shared import re

def _path_segment_tag(segment: str) -> str:
    match = re.match(r"([a-zA-Z0-9_-]+)", segment.strip())
    return match.group(1).lower() if match else ""

_path_segment_tag.__module__ = 'pptx2html.htmlir.compiler'
