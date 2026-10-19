# Origin: pptx2html/htmlir/compiler.py::_path_is_descendant
from __future__ import annotations

def _path_is_descendant(path: str, parent_path: str) -> bool:
    return bool(path and parent_path and path.startswith(parent_path + " > "))

_path_is_descendant.__module__ = 'pptx2html.htmlir.compiler'
