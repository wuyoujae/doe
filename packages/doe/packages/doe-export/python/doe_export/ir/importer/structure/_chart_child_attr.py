# Origin: pptx2html/ir/builder.py::PresentationBuilder._chart_child_attr
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _chart_child_attr(container: ET.Element, child_name: str, attr_name: str) -> Optional[str]:
    _C = NAMESPACE.DML_CHART
    child = container.find(f"{{{_C}}}{child_name}")
    return child.get(attr_name) if child is not None else None

_chart_child_attr.__func__.__module__ = 'pptx2html.ir.builder'
_chart_child_attr.__func__.__qualname__ = 'PresentationBuilder._chart_child_attr'
