# Origin: pptx2html/htmlir/compiler.py::_path_is_under_any
from __future__ import annotations
from doe_export.html.compiler.document._path_is_same_or_descendant import _path_is_same_or_descendant

def _path_is_under_any(path: str, prefixes: set[str]) -> bool:
    return any(_path_is_same_or_descendant(path, prefix) for prefix in prefixes)

_path_is_under_any.__module__ = 'pptx2html.htmlir.compiler'
