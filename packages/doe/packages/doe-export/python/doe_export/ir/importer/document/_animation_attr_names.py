# Origin: pptx2html/ir/builder.py::PresentationBuilder._animation_attr_names
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

@staticmethod
def _animation_attr_names(c_bhvr: Optional[ET.Element]) -> list[str]:
    if c_bhvr is None:
        return []
    _P = NAMESPACE.PML_MAIN
    return [
        node.text
        for node in c_bhvr.findall(f"{{{_P}}}attrNameLst/{{{_P}}}attrName")
        if node.text
    ]

_animation_attr_names.__func__.__module__ = 'pptx2html.ir.builder'
_animation_attr_names.__func__.__qualname__ = 'PresentationBuilder._animation_attr_names'
