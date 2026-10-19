# Origin: pptx2html/ir/builder.py::PresentationBuilder._is_windows_runtime
from __future__ import annotations
from doe_export.ir.importer.shared import os

@staticmethod
def _is_windows_runtime() -> bool:
    return os.name == "nt"

_is_windows_runtime.__func__.__module__ = 'pptx2html.ir.builder'
_is_windows_runtime.__func__.__qualname__ = 'PresentationBuilder._is_windows_runtime'
