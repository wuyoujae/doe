# Origin: pptx2html/ir/builder.py::PresentationBuilder._primary_shadow
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, Shadow

@staticmethod
def _primary_shadow(effects: list[Shadow]) -> Optional[Shadow]:
    if not effects:
        return None
    outer_blur = max((effect.blur_pt or 0.0 for effect in effects if effect.type == "outer"), default=0.0)
    soft_effects = [effect for effect in effects if effect.type in {"softEdge", "blur"}]
    if soft_effects:
        strongest_soft = max(soft_effects, key=lambda effect: effect.blur_pt or 0.0)
        if (strongest_soft.blur_pt or 0.0) >= outer_blur:
            return strongest_soft
    return effects[0]

_primary_shadow.__func__.__module__ = 'pptx2html.ir.builder'
_primary_shadow.__func__.__qualname__ = 'PresentationBuilder._primary_shadow'
