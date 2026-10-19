# Origin: pptx2html/ir/builder.py::PresentationBuilder._chart_data_label_format
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

def _chart_data_label_format(self, container: Optional[ET.Element]) -> Optional[str]:
    if container is None:
        return None
    _C = NAMESPACE.DML_CHART
    labels = container.find(f"{{{_C}}}dLbls")
    return self._chart_num_format(labels)

_chart_data_label_format.__module__ = 'pptx2html.ir.builder'
_chart_data_label_format.__qualname__ = 'PresentationBuilder._chart_data_label_format'
