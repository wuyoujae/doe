# Origin: pptx_pipeline.py::_svg_local_name
from __future__ import annotations

def _svg_local_name(value: str) -> str:
    return value.rsplit("}", 1)[-1].lower()

_svg_local_name.__module__ = 'pptx_pipeline'
