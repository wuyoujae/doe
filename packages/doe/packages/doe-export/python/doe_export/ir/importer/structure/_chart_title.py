# Origin: pptx2html/ir/builder.py::PresentationBuilder._chart_title
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _chart_title(chart_elem: ET.Element) -> Optional[str]:
    _C = NAMESPACE.DML_CHART
    _A = NAMESPACE.DML_MAIN
    title = chart_elem.find(f"{{{_C}}}title")
    if title is None:
        return None

    texts = [t.text for t in title.findall(f".//{{{_A}}}t") if t.text]
    if not texts:
        texts = [v.text for v in title.findall(f".//{{{_C}}}v") if v.text]
    return "".join(texts) if texts else None

_chart_title.__func__.__module__ = 'pptx2html.ir.builder'
_chart_title.__func__.__qualname__ = 'PresentationBuilder._chart_title'
