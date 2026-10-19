# Origin: pptx2html/htmlir/compiler.py::_parent_path
from __future__ import annotations

def _parent_path(path: str) -> str:
    if not path or " > " not in path:
        return ""
    return path.rsplit(" > ", 1)[0]

_parent_path.__module__ = 'pptx2html.htmlir.compiler'
