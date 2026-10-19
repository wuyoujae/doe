# Origin: pptx_pipeline.py::_current_ir_storage_sha256
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import hashlib
from doe_export.pipeline.canonical._current_ir_storage_bytes import _current_ir_storage_bytes

def _current_ir_storage_sha256(value: Any) -> str:
    return hashlib.sha256(_current_ir_storage_bytes(value)).hexdigest()

_current_ir_storage_sha256.__module__ = 'pptx_pipeline'
