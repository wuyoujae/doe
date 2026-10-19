# Origin: pptx2html/ir/builder.py::PresentationBuilder._smartart_geometry_is_bounded
from __future__ import annotations
from doe_export.ir.importer.shared import Shape, re

@staticmethod
def _smartart_geometry_is_bounded(shape: Shape) -> bool:
    for geometry_path in shape.geometry_paths:
        values = [
            float(value)
            for value in re.findall(r"-?\d+(?:\.\d+)?", geometry_path.d or "")
        ]
        if values and (min(values) < -10.0 or max(values) > 110.0):
            return False
    return True

_smartart_geometry_is_bounded.__func__.__module__ = 'pptx2html.ir.builder'
_smartart_geometry_is_bounded.__func__.__qualname__ = 'PresentationBuilder._smartart_geometry_is_bounded'
