# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._embedded_font_css
from __future__ import annotations
from doe_export.html.renderer.shared import IRPresentation, css_font_format

@staticmethod
def _embedded_font_css(ir: IRPresentation) -> str:
    rules: list[str] = []
    for font in ir.embedded_fonts or []:
        typeface = str(getattr(font, "typeface", "") or "").strip()
        data = str(getattr(font, "data", "") or "").strip()
        content_type = str(getattr(font, "content_type", "") or "font/otf").strip()
        if not typeface or not data:
            continue
        safe_family = typeface.replace("\\", "\\\\").replace('"', '\\"')
        style_name = str(getattr(font, "style", "regular") or "regular").lower()
        typeface_lower = typeface.lower()
        if any(token in style_name or token in typeface_lower for token in ("bold", "heavy", "black")):
            weight = "700"
        elif "light" in typeface_lower:
            weight = "300"
        else:
            weight = "400"
        font_style = "italic" if "italic" in style_name or "italic" in typeface_lower else "normal"
        font_format = css_font_format(content_type)
        source = (
            data.replace("yrkie-asset-base64://", "yrkie-asset-data://", 1)
            if data.startswith("yrkie-asset-base64://")
            else f"data:{content_type};base64,{data}"
        )
        rules.append(
            "@font-face{"
            f'font-family:"{safe_family}";'
            f"font-style:{font_style};font-weight:{weight};font-display:block;"
            f"src:url('{source}') format('{font_format}');"
            "}"
        )
    return "\n".join(rules)

_embedded_font_css.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_embedded_font_css.__func__.__qualname__ = 'HtmlRenderer._embedded_font_css'
