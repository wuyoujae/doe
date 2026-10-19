# Origin: pptx2html/ir/builder.py::PresentationBuilder._animation_to_value
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _animation_to_value(elem: ET.Element) -> Optional[str]:
    _P = NAMESPACE.PML_MAIN
    to = elem.find(f"{{{_P}}}to")
    if to is None:
        return None
    for child in to.iter():
        if child is to:
            continue
        if child.get("val") is not None:
            return child.get("val")
    return None

_animation_to_value.__func__.__module__ = 'pptx2html.ir.builder'
_animation_to_value.__func__.__qualname__ = 'PresentationBuilder._animation_to_value'
