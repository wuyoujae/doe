# Origin: pptx2html/ir/builder.py::PresentationBuilder._text_margins_from_body_pr
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional, emu_to_pt

@staticmethod
def _text_margins_from_body_pr(body_pr: Optional[ET.Element]) -> dict[str, Optional[float]]:
    if body_pr is None:
        return {"left": None, "right": None, "top": None, "bottom": None}
    return {
        "left": emu_to_pt(body_pr.get("lIns")),
        "right": emu_to_pt(body_pr.get("rIns")),
        "top": emu_to_pt(body_pr.get("tIns")),
        "bottom": emu_to_pt(body_pr.get("bIns")),
    }

_text_margins_from_body_pr.__func__.__module__ = 'pptx2html.ir.builder'
_text_margins_from_body_pr.__func__.__qualname__ = 'PresentationBuilder._text_margins_from_body_pr'
