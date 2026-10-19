# Origin: pptx2html/server/pptx_writer.py::_animation_common_behavior
from __future__ import annotations
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._ctn import _ctn

def _animation_common_behavior(ctn_id: str, spid: int, duration_ms: int, attr_names: list[str]):
    c_bhvr = OxmlElement("p:cBhvr")
    ctn = _ctn(ctn_id, {"dur": str(duration_ms), "fill": "hold"})
    c_bhvr.append(ctn)
    tgt_el = OxmlElement("p:tgtEl")
    sp_tgt = OxmlElement("p:spTgt")
    sp_tgt.set("spid", str(spid))
    tgt_el.append(sp_tgt)
    c_bhvr.append(tgt_el)
    if attr_names:
        attr_lst = OxmlElement("p:attrNameLst")
        for attr_name in attr_names:
            attr = OxmlElement("p:attrName")
            attr.text = str(attr_name)
            attr_lst.append(attr)
        c_bhvr.append(attr_lst)
    return c_bhvr

_animation_common_behavior.__module__ = 'pptx2html.server.pptx_writer'
