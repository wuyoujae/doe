# Origin: pptx2html/htmlir/compiler.py::_path_is_same_or_descendant
from __future__ import annotations
from doe_export.html.compiler.document._path_is_descendant import _path_is_descendant

def _path_is_same_or_descendant(path: str, parent_path: str) -> bool:
    return path == parent_path or _path_is_descendant(path, parent_path)

_path_is_same_or_descendant.__module__ = 'pptx2html.htmlir.compiler'
