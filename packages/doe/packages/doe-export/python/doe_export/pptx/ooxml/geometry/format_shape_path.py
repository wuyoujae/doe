# Origin: pptx2html/server/ooxml_pptx_writer.py::format_shape_path
from __future__ import annotations

def format_shape_path(path: tuple[int, ...]) -> str:
    return ".".join(str(index) for index in path) or "<root>"

format_shape_path.__module__ = 'pptx2html.server.ooxml_pptx_writer'
