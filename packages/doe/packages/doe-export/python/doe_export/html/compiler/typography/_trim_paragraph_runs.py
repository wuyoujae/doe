# Origin: pptx2html/htmlir/compiler.py::_trim_paragraph_runs
from __future__ import annotations
from doe_export.html.compiler.shared import Run

def _trim_paragraph_runs(runs: list[Run], *, preserve_edge_spaces: bool = False) -> list[Run]:
    result = [run for run in runs if run.kind == "break" or run.text]
    while result and result[0].kind == "break":
        result.pop(0)
    while result and result[-1].kind == "break":
        result.pop()
    if not preserve_edge_spaces:
        segment_start = 0
        for segment_end in [
            index
            for index, run in enumerate(result)
            if run.kind == "break"
        ] + [len(result)]:
            text_indexes = [
                index
                for index in range(segment_start, segment_end)
                if result[index].kind != "break"
            ]
            for index in text_indexes:
                result[index].text = result[index].text.lstrip()
                if result[index].text:
                    break
            for index in reversed(text_indexes):
                result[index].text = result[index].text.rstrip()
                if result[index].text:
                    break
            segment_start = segment_end + 1
    return [run for run in result if run.kind == "break" or run.text]

_trim_paragraph_runs.__module__ = 'pptx2html.htmlir.compiler'
