# Origin: pptx2html/ir/builder.py::PresentationBuilder._chart_values
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _chart_values(container: Optional[ET.Element]) -> list[str]:
    if container is None:
        return []

    _C = NAMESPACE.DML_CHART
    values = [v.text for v in container.findall(f".//{{{_C}}}pt/{{{_C}}}v") if v.text]
    if values:
        return values

    return [v.text for v in container.findall(f"{{{_C}}}v") if v.text]

_chart_values.__func__.__module__ = 'pptx2html.ir.builder'
_chart_values.__func__.__qualname__ = 'PresentationBuilder._chart_values'
