# Origin: pptx_pipeline.py::_source_pptx_bytes
from __future__ import annotations
from doe_export.pipeline.shared import Path

def _source_pptx_bytes(source_pptx: bytes | str | Path | None) -> bytes | None:
    if source_pptx is None:
        return None
    if isinstance(source_pptx, bytes):
        return source_pptx
    return Path(source_pptx).read_bytes()

_source_pptx_bytes.__module__ = 'pptx_pipeline'
