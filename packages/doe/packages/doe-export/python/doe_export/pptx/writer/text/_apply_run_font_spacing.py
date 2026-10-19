# Origin: pptx2html/server/pptx_writer.py::_apply_run_font_spacing
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _apply_run_font_spacing(run, font: dict[str, Any]) -> None:
    spacing = font.get("char_spacing_pt")
    if spacing is None:
        return
    try:
        spacing_pt = float(spacing)
    except (TypeError, ValueError):
        return
    r_pr = run._r.get_or_add_rPr()
    r_pr.set("spc", str(int(round(spacing_pt * 100))))

_apply_run_font_spacing.__module__ = 'pptx2html.server.pptx_writer'
