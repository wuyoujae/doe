# Origin: pptx2html/server/ooxml_pptx_writer.py::safe_transition_type
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def safe_transition_type(value: Any) -> str:
    name = str(value or "fade")
    allowed = {
        "blinds",
        "checker",
        "circle",
        "comb",
        "cover",
        "cut",
        "diamond",
        "dissolve",
        "fade",
        "newsflash",
        "plus",
        "pull",
        "push",
        "random",
        "randomBar",
        "split",
        "strips",
        "wedge",
        "wheel",
        "wipe",
        "zoom",
    }
    return name if name in allowed else "fade"

safe_transition_type.__module__ = 'pptx2html.server.ooxml_pptx_writer'
