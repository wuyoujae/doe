# Origin: pptx2html/ir/builder.py::PresentationBuilder._drawingml_rect_percentages
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional, percentage_to_float

@staticmethod
def _drawingml_rect_percentages(elem: Optional[ET.Element]) -> dict[str, Optional[float]]:
    if elem is None:
        return {"left": None, "right": None, "top": None, "bottom": None}
    return {
        "left": percentage_to_float(elem.get("l")),
        "right": percentage_to_float(elem.get("r")),
        "top": percentage_to_float(elem.get("t")),
        "bottom": percentage_to_float(elem.get("b")),
    }

_drawingml_rect_percentages.__func__.__module__ = 'pptx2html.ir.builder'
_drawingml_rect_percentages.__func__.__qualname__ = 'PresentationBuilder._drawingml_rect_percentages'
