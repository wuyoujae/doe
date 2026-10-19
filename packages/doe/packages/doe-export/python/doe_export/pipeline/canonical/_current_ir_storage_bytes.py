# Origin: pptx_pipeline.py::_current_ir_storage_bytes
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import json

def _current_ir_storage_bytes(value: Any) -> bytes:
    """Serialize Current IR exactly as the V2 object-storage JSON blob."""

    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")

_current_ir_storage_bytes.__module__ = 'pptx_pipeline'
