# Origin: pptx2html/htmlir/compiler.py::_signal_process_group
from __future__ import annotations
from doe_export.html.compiler.shared import os

def _signal_process_group(process_group_id: int, signal_number: int) -> None:
    try:
        os.killpg(process_group_id, signal_number)
    except (ProcessLookupError, PermissionError):
        pass

_signal_process_group.__module__ = 'pptx2html.htmlir.compiler'
