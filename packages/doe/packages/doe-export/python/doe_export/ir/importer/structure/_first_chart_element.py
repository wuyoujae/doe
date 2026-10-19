# Origin: pptx2html/ir/builder.py::PresentationBuilder._first_chart_element
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional, local_name

@staticmethod
def _first_chart_element(plot_area: ET.Element) -> Optional[ET.Element]:
    for child in plot_area:
        name = local_name(child.tag)
        if name.endswith("Chart"):
            return child
    return None

_first_chart_element.__func__.__module__ = 'pptx2html.ir.builder'
_first_chart_element.__func__.__qualname__ = 'PresentationBuilder._first_chart_element'
