# Origin: pptx2html/server/pptx_writer.py::_animation_preset_attrs
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _animation_preset_attrs(step: dict[str, Any]) -> dict[str, str]:
    kind = step.get("kind")
    if kind == "animEffect":
        preset_class = "exit" if step.get("transition") == "out" else "entr"
        return {"presetClass": preset_class}
    if kind in {"animMotion", "animScale"}:
        return {"presetClass": "emph"}
    return {}

_animation_preset_attrs.__module__ = 'pptx2html.server.pptx_writer'
