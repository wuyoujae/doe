# Origin: pptx2html/ir/builder.py::PresentationBuilder._chart_num_format
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _chart_num_format(container: Optional[ET.Element]) -> Optional[str]:
    if container is None:
        return None
    _C = NAMESPACE.DML_CHART
    num_fmt = container.find(f"{{{_C}}}numFmt")
    return num_fmt.get("formatCode") if num_fmt is not None else None

_chart_num_format.__func__.__module__ = 'pptx2html.ir.builder'
_chart_num_format.__func__.__qualname__ = 'PresentationBuilder._chart_num_format'
