# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_slide_transition
from __future__ import annotations
from doe_export.ir.importer.shared import NAMESPACE, Optional, SlidePart, SlideTransition, local_name, parse_bool

def _build_slide_transition(self, slide_part: SlidePart) -> Optional[SlideTransition]:
    _P = NAMESPACE.PML_MAIN
    transition = slide_part.element.find(f"{{{_P}}}transition")
    if transition is None:
        return None

    effect = None
    for child in transition:
        name = local_name(child.tag)
        if name not in {"sndAc", "extLst"}:
            effect = child
            break

    speed = transition.get("spd")
    direction = None
    if effect is not None:
        direction = (
            effect.get("dir")
            or effect.get("orient")
            or effect.get("side")
            or effect.get("spokes")
        )
    return SlideTransition(
        type=local_name(effect.tag) if effect is not None else "fade",
        speed=speed,
        direction=direction,
        duration_ms=self._transition_duration_ms(speed),
        advance_on_click=parse_bool(transition.get("advClick"))
        if transition.get("advClick") is not None
        else None,
        advance_after_ms=self._duration_ms(transition.get("advTm")),
        raw_attrs={str(k): str(v) for k, v in transition.attrib.items()},
    )

_build_slide_transition.__module__ = 'pptx2html.ir.builder'
_build_slide_transition.__qualname__ = 'PresentationBuilder._build_slide_transition'
