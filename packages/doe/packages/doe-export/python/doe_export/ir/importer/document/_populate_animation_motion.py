# Origin: pptx2html/ir/builder.py::PresentationBuilder._populate_animation_motion
from __future__ import annotations
from doe_export.ir.importer.shared import AnimationStep

@staticmethod
def _populate_animation_motion(step: AnimationStep) -> None:
    if not step.motion_path:
        return
    values: list[float] = []
    for token in step.motion_path.replace(",", " ").split():
        try:
            values.append(float(token))
        except ValueError:
            continue
    if len(values) >= 2:
        step.motion_dx = values[-2]
        step.motion_dy = values[-1]

_populate_animation_motion.__func__.__module__ = 'pptx2html.ir.builder'
_populate_animation_motion.__func__.__qualname__ = 'PresentationBuilder._populate_animation_motion'
