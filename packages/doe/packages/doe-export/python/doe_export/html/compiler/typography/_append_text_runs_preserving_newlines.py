# Origin: pptx2html/htmlir/compiler.py::_append_text_runs_preserving_newlines
from __future__ import annotations
from doe_export.html.compiler.shared import Font
from doe_export.html.compiler.shared import Run

def _append_text_runs_preserving_newlines(runs: list[Run], text: str, font: Font) -> None:
    parts = text.split("\n")
    for index, part in enumerate(parts):
        if index > 0:
            runs.append(Run(kind="break"))
        if part:
            runs.append(Run(text=part, kind="text", font=font))

_append_text_runs_preserving_newlines.__module__ = 'pptx2html.htmlir.compiler'
