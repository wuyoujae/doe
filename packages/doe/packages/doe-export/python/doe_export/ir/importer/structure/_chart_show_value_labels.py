# Origin: pptx2html/ir/builder.py::PresentationBuilder._chart_show_value_labels
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional, parse_bool

@staticmethod
def _chart_show_value_labels(container: Optional[ET.Element]) -> Optional[bool]:
    if container is None:
        return None
    _C = NAMESPACE.DML_CHART
    labels = container.find(f"{{{_C}}}dLbls")
    if labels is None:
        return None
    show_val = labels.find(f"{{{_C}}}showVal")
    return parse_bool(show_val.get("val")) if show_val is not None else None

_chart_show_value_labels.__func__.__module__ = 'pptx2html.ir.builder'
_chart_show_value_labels.__func__.__qualname__ = 'PresentationBuilder._chart_show_value_labels'
