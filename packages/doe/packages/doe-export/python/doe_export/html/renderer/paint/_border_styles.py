# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._border_styles
from __future__ import annotations
from doe_export.html.renderer.shared import Border

def _border_styles(self, border: Border) -> list[str]:
    styles = []
    color = self._css_border_color(border)
    if border.width and color:
        w = f"{border.width:.2f}pt"
        if border.dash and border.dash != "solid":
            styles.append(f"outline:{w} {border.dash} {color}")
            styles.append("outline-offset:-1pt")
        else:
            styles.append(f"border:{w} solid {color}")
    elif border.width:
        styles.append(f"border-width:{border.width:.2f}pt")
        styles.append("border-style:solid")
    return styles

_border_styles.__module__ = 'pptx2html.renderer.html_renderer'
_border_styles.__qualname__ = 'HtmlRenderer._border_styles'
