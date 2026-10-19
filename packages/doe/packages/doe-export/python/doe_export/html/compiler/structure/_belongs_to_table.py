# Origin: pptx2html/htmlir/compiler.py::_belongs_to_table
from __future__ import annotations
from doe_export.html.compiler.document._path_is_descendant import _path_is_descendant
from doe_export.html.compiler.document._path_is_same_or_descendant import _path_is_same_or_descendant

def _belongs_to_table(path: str, table_path: str, table_paths: list[str]) -> bool:
    if not _path_is_same_or_descendant(path, table_path):
        return False
    for other in table_paths:
        if other == table_path:
            continue
        if _path_is_descendant(other, table_path) and _path_is_same_or_descendant(path, other):
            return False
    return True

_belongs_to_table.__module__ = 'pptx2html.htmlir.compiler'
