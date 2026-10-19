# Origin: pptx2html/ir/builder.py::PresentationBuilder._animation_value_at
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _animation_value_at(elem: ET.Element, time: str) -> Optional[str]:
    _P = NAMESPACE.PML_MAIN
    tav = elem.find(f"{{{_P}}}tavLst/{{{_P}}}tav[@tm='{time}']")
    if tav is None:
        return None
    for child in tav.iter():
        if child is tav:
            continue
        if child.get("val") is not None:
            return child.get("val")
    return None

_animation_value_at.__func__.__module__ = 'pptx2html.ir.builder'
_animation_value_at.__func__.__qualname__ = 'PresentationBuilder._animation_value_at'
