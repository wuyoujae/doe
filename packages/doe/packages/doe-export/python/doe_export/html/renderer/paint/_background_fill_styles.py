# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._background_fill_styles
from __future__ import annotations
from doe_export.html.renderer.shared import Fill

def _background_fill_styles(
    self,
    fill: Fill,
    width_pt: float | None = None,
    height_pt: float | None = None,
) -> list[str]:
    styles: list[str] = []
    if fill.type == "solid":
        color = self._css_color(fill.color)
        if color and fill.alpha is not None and fill.alpha < 1:
            raw = color.lstrip("#")
            color = (
                f"rgba({int(raw[0:2], 16)},{int(raw[2:4], 16)},"
                f"{int(raw[4:6], 16)},{max(0.0, min(1.0, fill.alpha)):.3f})"
            )
        if color:
            styles.append(f"background-color:{color}")
    elif fill.type == "gradient" and fill.gradient_stops:
        gradient = self._css_gradient_fill(fill)
        if gradient:
            styles.append(f"background:{gradient}")
    elif fill.type == "picture" and fill.image:
        styles.extend(
            self._image_background_styles(
                fill.image,
                width_pt or self._slide_w,
                height_pt or self._slide_h,
                opacity_multiplier=fill.alpha,
            )
        )
    elif fill.type == "pattern":
        foreground = self._css_color(fill.pattern_fg_color) or "#000000"
        background = self._css_color(fill.pattern_bg_color) or "#FFFFFF"
        styles.extend(
            [
                f"background-color:{background}",
                "background-image:repeating-linear-gradient(45deg,"
                f"transparent 0 4px,{foreground} 4px 5px,transparent 5px 8px)",
            ]
        )
    return styles

_background_fill_styles.__module__ = 'pptx2html.renderer.html_renderer'
_background_fill_styles.__qualname__ = 'HtmlRenderer._background_fill_styles'
