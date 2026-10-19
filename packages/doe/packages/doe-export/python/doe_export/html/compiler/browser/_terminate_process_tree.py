# Origin: pptx2html/htmlir/compiler.py::_terminate_process_tree
from __future__ import annotations
from doe_export.html.compiler.shared import subprocess
from doe_export.html.compiler.shared import os, signal
from doe_export.html.compiler.browser._signal_process_group import _signal_process_group

def _terminate_process_tree(process: subprocess.Popen[str], signal_number: int) -> None:
    if os.name == "nt":
        if signal_number == getattr(signal, "SIGKILL", None):
            process.kill()
        else:
            process.terminate()
        return
    _signal_process_group(process.pid, signal_number)

_terminate_process_tree.__module__ = 'pptx2html.htmlir.compiler'
