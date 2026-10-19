# Origin: pptx2html/ir/builder.py::PresentationBuilder._chart_series_color
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

def _chart_series_color(self, ser: ET.Element) -> Optional[str]:
    _C = NAMESPACE.DML_CHART
    sp_pr = ser.find(f"{{{_C}}}spPr")
    fill = self._parse_fill(sp_pr)
    if fill and fill.type == "solid":
        return fill.color
    return None

_chart_series_color.__module__ = 'pptx2html.ir.builder'
_chart_series_color.__qualname__ = 'PresentationBuilder._chart_series_color'
