# Origin: pptx2html/ir/builder.py::PresentationBuilder._line_has_no_fill
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _line_has_no_fill(container: Optional[ET.Element]) -> bool:
    if container is None:
        return False
    _A = NAMESPACE.DML_MAIN
    ln = container.find(f"{{{_A}}}ln")
    return ln is not None and ln.find(f"{{{_A}}}noFill") is not None

_line_has_no_fill.__func__.__module__ = 'pptx2html.ir.builder'
_line_has_no_fill.__func__.__qualname__ = 'PresentationBuilder._line_has_no_fill'
