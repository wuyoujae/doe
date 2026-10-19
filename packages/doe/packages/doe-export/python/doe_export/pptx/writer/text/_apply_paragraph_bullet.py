# Origin: pptx2html/server/pptx_writer.py::_apply_paragraph_bullet
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._append_srgb import _append_srgb
from doe_export.pptx.writer.xml._clean_hex import _clean_hex
from doe_export.pptx.writer.xml._remove_children import _remove_children

def _apply_paragraph_bullet(p_pr, bullet: dict[str, Any] | None) -> None:
    _remove_children(
        p_pr,
        (
            "a:buNone",
            "a:buAutoNum",
            "a:buChar",
            "a:buBlip",
            "a:buClr",
            "a:buClrTx",
            "a:buFont",
            "a:buFontTx",
            "a:buSzPct",
            "a:buSzPts",
            "a:buSzTx",
        ),
    )
    if not bullet or bullet.get("kind") in {None, "none"}:
        return
    if bullet.get("follows_text_size"):
        p_pr.append(OxmlElement("a:buSzTx"))
    elif bullet.get("size_pt") is not None:
        size = OxmlElement("a:buSzPts")
        size.set("val", str(int(round(float(bullet.get("size_pt") or 0) * 100))))
        p_pr.append(size)
    elif bullet.get("size_pct") is not None:
        size = OxmlElement("a:buSzPct")
        size.set("val", str(int(round(float(bullet.get("size_pct") or 1) * 100000))))
        p_pr.append(size)

    color = _clean_hex(bullet.get("color"))
    if color and not bullet.get("follows_text_color"):
        bu_clr = OxmlElement("a:buClr")
        _append_srgb(bu_clr, color)
        p_pr.append(bu_clr)
    elif bullet.get("follows_text_color"):
        p_pr.append(OxmlElement("a:buClrTx"))

    font_family = bullet.get("font_family")
    if font_family and not bullet.get("follows_text_font"):
        bu_font = OxmlElement("a:buFont")
        bu_font.set("typeface", str(font_family))
        p_pr.append(bu_font)
    elif bullet.get("follows_text_font"):
        p_pr.append(OxmlElement("a:buFontTx"))

    if bullet.get("kind") == "auto":
        auto = OxmlElement("a:buAutoNum")
        auto.set("type", str(bullet.get("auto_number_scheme") or "arabicPeriod"))
        if bullet.get("start_at") is not None:
            auto.set("startAt", str(max(1, int(bullet.get("start_at") or 1))))
        p_pr.append(auto)
        return

    char = bullet.get("char") or "\u2022"
    bu_char = OxmlElement("a:buChar")
    bu_char.set("char", str(char))
    p_pr.append(bu_char)

_apply_paragraph_bullet.__module__ = 'pptx2html.server.pptx_writer'
