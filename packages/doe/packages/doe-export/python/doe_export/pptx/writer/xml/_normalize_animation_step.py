# Origin: pptx2html/server/pptx_writer.py::_normalize_animation_step
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.xml._safe_int import _safe_int

def _normalize_animation_step(step: dict[str, Any], shape_id_map: dict[int, int]) -> dict[str, Any] | None:
    try:
        target_shape_id = int(step.get("target_shape_id"))
    except (TypeError, ValueError):
        return None
    spid = shape_id_map.get(target_shape_id, target_shape_id)
    kind = str(step.get("kind") or "")
    if kind not in {"set", "animEffect", "animMotion", "animScale"}:
        return None
    return {
        **step,
        "spid": spid,
        "kind": kind,
        "click_index": max(0, _safe_int(step.get("click_index"), 0)),
        "order": _safe_int(step.get("order"), 0),
        "start_ms": max(0, _safe_int(step.get("start_ms", step.get("delay_ms")), 0)),
        "duration_ms": max(1, _safe_int(step.get("duration_ms"), 1)),
    }

_normalize_animation_step.__module__ = 'pptx2html.server.pptx_writer'
