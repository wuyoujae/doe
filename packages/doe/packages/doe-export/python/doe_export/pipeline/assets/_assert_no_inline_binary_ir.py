# Origin: pptx_pipeline.py::_assert_no_inline_binary_ir
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import ir_contains_inline_asset

def _assert_no_inline_binary_ir(value: Any) -> None:
    if ir_contains_inline_asset(value):
        raise ValueError(
            "Current IR resource fields must contain managed asset references."
        )

_assert_no_inline_binary_ir.__module__ = 'pptx_pipeline'
