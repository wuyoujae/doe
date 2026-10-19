# Origin: htmlir_server.py::HtmlIrRequestHandler.log_message
from __future__ import annotations
from doe_export.service.shared import Any
from doe_export.service.shared import sys

def log_message(self, format: str, *args: Any) -> None:
    sys.stderr.write("htmlir-runtime " + (format % args) + "\n")

log_message.__module__ = 'htmlir_server'
log_message.__qualname__ = 'HtmlIrRequestHandler.log_message'
