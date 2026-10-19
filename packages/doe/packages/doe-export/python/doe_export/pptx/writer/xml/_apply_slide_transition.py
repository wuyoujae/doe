# Origin: pptx2html/server/pptx_writer.py::_apply_slide_transition
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement, qn
from doe_export.pptx.writer.xml._insert_slide_child_before import _insert_slide_child_before
from doe_export.pptx.writer.xml._remove_children import _remove_children
from doe_export.pptx.writer.xml._safe_int import _safe_int
from doe_export.pptx.writer.xml._safe_transition_type import _safe_transition_type
from doe_export.pptx.writer.xml._transition_direction_attr import _transition_direction_attr
from doe_export.pptx.writer.xml._transition_speed_from_duration import _transition_speed_from_duration

def _apply_slide_transition(slide, transition: dict[str, Any] | None) -> None:
    root = slide._element
    _remove_children(root, ("p:transition",))
    if not transition:
        return
    effect_type = _safe_transition_type(transition.get("type"))
    if effect_type == "none":
        return

    elem = OxmlElement("p:transition")
    speed = transition.get("speed") or _transition_speed_from_duration(transition.get("duration_ms"))
    if speed:
        elem.set("spd", str(speed))
    if transition.get("advance_on_click") is not None:
        elem.set("advClick", "1" if bool(transition.get("advance_on_click")) else "0")
    if transition.get("advance_after_ms") is not None:
        elem.set("advTm", str(max(0, _safe_int(transition.get("advance_after_ms"), 0))))

    effect = OxmlElement(f"p:{effect_type}")
    direction = transition.get("direction")
    if direction is not None:
        effect.set(_transition_direction_attr(effect_type, direction), str(direction))
    elem.append(effect)
    _insert_slide_child_before(root, elem, (qn("p:timing"), qn("p:extLst")))

_apply_slide_transition.__module__ = 'pptx2html.server.pptx_writer'
