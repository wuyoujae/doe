# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_run
from __future__ import annotations
from doe_export.html.renderer.shared import Optional, TextFrame, html

def _render_run(self, run, tf: Optional[TextFrame] = None, para=None) -> str:
    if run.kind == "break":
        return "<br>"

    r_style = []
    f = run.font
    if any((f.family, f.latin_family, f.ea_family, f.cs_family, f.sym_family)):
        r_style.append(f"font-family:{self._css_font_stack(f, run.text)}")
    if f.size_pt:
        size_pt = f.size_pt * self._font_scale(tf)
        r_style.append(f"font-size:{size_pt:.1f}pt")
    if f.bold:
        r_style.append("font-weight:bold")
    if f.italic:
        r_style.append("font-style:italic")
    decorations = []
    if f.underline and f.underline != "none":
        decorations.append("underline")
    if f.strike:
        decorations.append("line-through")
    if decorations:
        r_style.append(f"text-decoration-line:{' '.join(decorations)}")
        decoration_style = self._css_text_decoration_style(f)
        if decoration_style:
            r_style.append(f"text-decoration-style:{decoration_style}")
        decoration_color = self._css_color(getattr(f, "underline_color", None) or getattr(f, "strike_color", None))
        if decoration_color:
            r_style.append(f"text-decoration-color:{decoration_color}")
        decoration_width = getattr(f, "underline_width_pt", None) or getattr(f, "strike_width_pt", None)
        if decoration_width:
            r_style.append(f"text-decoration-thickness:{float(decoration_width):.3f}pt")
    color = self._css_font_color(f)
    if color:
        r_style.append(f"color:{color}")
    highlight = self._css_color(f.highlight)
    if highlight:
        r_style.append(f"background-color:{highlight}")
    if f.capitalization in ("all", "small"):
        r_style.append("text-transform:uppercase")
    if f.rtl is not None:
        r_style.append("direction:rtl" if f.rtl else "direction:ltr")
    if f.char_spacing_pt is not None:
        r_style.append(f"letter-spacing:{f.char_spacing_pt:.3f}pt")
    if getattr(f, "word_spacing_pt", None) is not None:
        r_style.append(f"word-spacing:{f.word_spacing_pt:.3f}pt")
    if f.shadow and f.shadow.type not in {"inner", "softEdge"}:
        color = self._css_color(f.shadow.color) or self._css_font_color(f) or "#000000"
        if f.shadow.alpha is not None and f.shadow.alpha < 1 and color.startswith("#") and len(color) == 7:
            raw = color.lstrip("#")
            color = (
                f"rgba({int(raw[0:2], 16)},{int(raw[2:4], 16)},"
                f"{int(raw[4:6], 16)},{f.shadow.alpha:.3f})"
            )
        r_style.append(
            "text-shadow:"
            f"{(f.shadow.offset_x or 0):.3f}pt "
            f"{(f.shadow.offset_y or 0):.3f}pt "
            f"{(f.shadow.blur_pt or 0):.3f}pt {color}"
        )
    r_style.append("font-kerning:none" if getattr(f, "kerning_pt", None) == 0 else "font-kerning:normal")
    if f.baseline:
        r_style.append(f"vertical-align:{f.baseline * 100:.1f}%")
    elif para is not None and para.font_align:
        vertical_map = {"t": "top", "ctr": "middle", "b": "bottom", "base": "baseline"}
        r_style.append(f"vertical-align:{vertical_map.get(para.font_align, 'baseline')}")
    if f.hyperlink_r_id:
        r_style.append("cursor:pointer")
        r_style.append("color:#0563C1")

    text = html.escape(run.text or "", quote=False)
    cls = "pptx-run pptx-field" if run.kind == "field" else "pptx-run"
    span = (
        f'<span class="{cls}" '
        f'style="{self._html_style(r_style)}">{text}</span>'
    )
    href = self._safe_href(getattr(f, "hyperlink_url", None))
    if href:
        return f'<a class="pptx-hyperlink" href="{href}">{span}</a>'
    return span

_render_run.__module__ = 'pptx2html.renderer.html_renderer'
_render_run.__qualname__ = 'HtmlRenderer._render_run'
