# Origin: pptx2html/ir/builder.py::PresentationBuilder._populate_animation_scale
from __future__ import annotations
from doe_export.ir.importer.shared import AnimationStep, ET, NAMESPACE, percentage_to_float

@staticmethod
def _populate_animation_scale(step: AnimationStep, elem: ET.Element) -> None:
    _P = NAMESPACE.PML_MAIN
    scale = elem.find(f"{{{_P}}}by")
    if scale is None:
        scale = elem.find(f"{{{_P}}}to")
    if scale is None:
        return
    step.scale_x = percentage_to_float(scale.get("x"))
    step.scale_y = percentage_to_float(scale.get("y"))

_populate_animation_scale.__func__.__module__ = 'pptx2html.ir.builder'
_populate_animation_scale.__func__.__qualname__ = 'PresentationBuilder._populate_animation_scale'
