# Origin: pptx2html/ir/builder.py::PresentationBuilder._text_from_text_run
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE

@staticmethod
def _text_from_text_run(run_elem: ET.Element) -> str:
    _A = NAMESPACE.DML_MAIN
    t_elem = run_elem.find(f"{{{_A}}}t")
    return t_elem.text if t_elem is not None and t_elem.text else ""

_text_from_text_run.__func__.__module__ = 'pptx2html.ir.builder'
_text_from_text_run.__func__.__qualname__ = 'PresentationBuilder._text_from_text_run'
