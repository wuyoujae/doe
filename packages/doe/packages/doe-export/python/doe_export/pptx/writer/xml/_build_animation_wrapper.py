# Origin: pptx2html/server/pptx_writer.py::_build_animation_wrapper
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._animation_preset_attrs import _animation_preset_attrs
from doe_export.pptx.writer.xml._append_start_condition import _append_start_condition
from doe_export.pptx.writer.xml._build_animation_behavior import _build_animation_behavior
from doe_export.pptx.writer.xml._ctn import _ctn

def _build_animation_wrapper(step: dict[str, Any], next_id) -> Any:
    wrapper_par = OxmlElement("p:par")
    wrapper_ctn = _ctn(
        next_id(),
        {
            "fill": "hold",
            "nodeType": "withEffect",
            **_animation_preset_attrs(step),
        },
    )
    wrapper_par.append(wrapper_ctn)
    _append_start_condition(wrapper_ctn, step.get("start_ms", 0))
    child_tn_lst = OxmlElement("p:childTnLst")
    behavior = _build_animation_behavior(step, next_id)
    if behavior is None:
        return None
    child_tn_lst.append(behavior)
    wrapper_ctn.append(child_tn_lst)
    return wrapper_par

_build_animation_wrapper.__module__ = 'pptx2html.server.pptx_writer'
