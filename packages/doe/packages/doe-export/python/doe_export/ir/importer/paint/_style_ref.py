# Origin: pptx2html/ir/builder.py::PresentationBuilder._style_ref
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, ET, NAMESPACE, Optional

def _style_ref(self, shape: BaseShape, ref_name: str) -> Optional[ET.Element]:
    _P = NAMESPACE.PML_MAIN
    _A = NAMESPACE.DML_MAIN
    style = shape._element.find(f"{{{_P}}}style")
    if style is None:
        return None
    return style.find(f"{{{_A}}}{ref_name}")

_style_ref.__module__ = 'pptx2html.ir.builder'
_style_ref.__qualname__ = 'PresentationBuilder._style_ref'
