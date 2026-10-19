# Origin: pptx2html/htmlir/compiler.py::_path_has_table_cell_segment
from __future__ import annotations
from doe_export.html.compiler.shared import TABLE_CELL_TAGS
from doe_export.html.compiler.document._path_segment_tag import _path_segment_tag

def _path_has_table_cell_segment(path: str) -> bool:
    return any(_path_segment_tag(segment) in TABLE_CELL_TAGS for segment in path.split(" > "))

_path_has_table_cell_segment.__module__ = 'pptx2html.htmlir.compiler'
