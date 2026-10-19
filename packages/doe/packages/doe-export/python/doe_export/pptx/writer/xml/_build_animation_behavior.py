# Origin: pptx2html/server/pptx_writer.py::_build_animation_behavior
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._animation_common_behavior import _animation_common_behavior
from doe_export.pptx.writer.geometry._animation_scale_to_ooxml import _animation_scale_to_ooxml
from doe_export.pptx.writer.geometry._motion_path_from_step import _motion_path_from_step
from doe_export.pptx.writer.xml._safe_int import _safe_int

def _build_animation_behavior(step: dict[str, Any], next_id):
    kind = step.get("kind")
    spid = int(step["spid"])
    duration_ms = max(1, _safe_int(step.get("duration_ms"), 1))
    if kind == "set":
        elem = OxmlElement("p:set")
        elem.append(_animation_common_behavior(next_id(), spid, duration_ms, step.get("attr_names") or ["style.visibility"]))
        to = OxmlElement("p:to")
        value = OxmlElement("p:strVal")
        value.set("val", str(step.get("to_value") or "visible"))
        to.append(value)
        elem.append(to)
        return elem
    if kind == "animEffect":
        elem = OxmlElement("p:animEffect")
        elem.set("transition", str(step.get("transition") or "in"))
        if step.get("filter"):
            elem.set("filter", str(step.get("filter")))
        elem.append(_animation_common_behavior(next_id(), spid, duration_ms, []))
        return elem
    if kind == "animMotion":
        elem = OxmlElement("p:animMotion")
        elem.set("origin", "layout")
        elem.set("path", str(step.get("motion_path") or _motion_path_from_step(step)))
        elem.set("pathEditMode", "relative")
        elem.append(_animation_common_behavior(next_id(), spid, duration_ms, ["ppt_x", "ppt_y"]))
        r_ctr = OxmlElement("p:rCtr")
        r_ctr.set("x", "0")
        r_ctr.set("y", "0")
        elem.append(r_ctr)
        return elem
    if kind == "animScale":
        elem = OxmlElement("p:animScale")
        elem.append(_animation_common_behavior(next_id(), spid, duration_ms, []))
        by = OxmlElement("p:by")
        by.set("x", _animation_scale_to_ooxml(step.get("scale_x")))
        by.set("y", _animation_scale_to_ooxml(step.get("scale_y")))
        elem.append(by)
        return elem
    return None

_build_animation_behavior.__module__ = 'pptx2html.server.pptx_writer'
