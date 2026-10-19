# Origin: pptx2html/server/pptx_writer.py::_append_start_condition
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._safe_int import _safe_int

def _append_start_condition(ctn, delay_ms: Any) -> None:
    st_cond_lst = OxmlElement("p:stCondLst")
    cond = OxmlElement("p:cond")
    cond.set("delay", str(max(0, _safe_int(delay_ms, 0))))
    st_cond_lst.append(cond)
    ctn.append(st_cond_lst)

_append_start_condition.__module__ = 'pptx2html.server.pptx_writer'
