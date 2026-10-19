# Origin: pptx2html/ir/builder.py::PresentationBuilder._shape_sp_pr
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, ET, NAMESPACE, Optional

@staticmethod
def _shape_sp_pr(shape: BaseShape) -> Optional[ET.Element]:
    """Find ``p:spPr`` from a shape's XML element."""
    return shape._element.find(f"{{{NAMESPACE.PML_MAIN}}}spPr")

_shape_sp_pr.__func__.__module__ = 'pptx2html.ir.builder'
_shape_sp_pr.__func__.__qualname__ = 'PresentationBuilder._shape_sp_pr'
