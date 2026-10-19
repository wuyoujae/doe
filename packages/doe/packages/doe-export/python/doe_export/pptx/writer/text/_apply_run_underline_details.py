# Origin: pptx2html/server/pptx_writer.py::_apply_run_underline_details
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._append_srgb import _append_srgb
from doe_export.pptx.writer.xml._clean_hex import _clean_hex
from doe_export.pptx.writer.xml._pt_to_emu import _pt_to_emu
from doe_export.pptx.writer.xml._remove_children import _remove_children
from doe_export.pptx.writer.shape._underline_to_dash import _underline_to_dash

def _apply_run_underline_details(r_pr, font: dict[str, Any]) -> None:
    if not font.get("underline") or str(font.get("underline")) == "none":
        return
    _remove_children(r_pr, ("a:uFill", "a:uLn"))
    color = _clean_hex(font.get("underline_color"))
    alpha = font.get("underline_alpha")
    width = font.get("underline_width_pt")
    dash = _underline_to_dash(str(font.get("underline") or ""))
    if width is not None or dash:
        u_ln = OxmlElement("a:uLn")
        if width is not None:
            u_ln.set("w", str(max(1, _pt_to_emu(width))))
        solid = OxmlElement("a:solidFill")
        _append_srgb(solid, color or _clean_hex(font.get("color")) or "000000", alpha)
        u_ln.append(solid)
        if dash:
            prst_dash = OxmlElement("a:prstDash")
            prst_dash.set("val", dash)
            u_ln.append(prst_dash)
        r_pr.append(u_ln)
        return
    if color:
        u_fill = OxmlElement("a:uFill")
        solid = OxmlElement("a:solidFill")
        _append_srgb(solid, color, alpha)
        u_fill.append(solid)
        r_pr.append(u_fill)

_apply_run_underline_details.__module__ = 'pptx2html.server.pptx_writer'
