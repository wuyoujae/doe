# Origin: pptx2html/server/pptx_writer.py::_apply_fill
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shape._apply_gradient_fill import _apply_gradient_fill
from doe_export.pptx.writer.shape._apply_picture_fill import _apply_picture_fill
from doe_export.pptx.writer.xml._apply_solid_alpha import _apply_solid_alpha
from doe_export.pptx.writer.xml._hex_color import _hex_color

def _apply_fill(
    pptx_shape,
    fill: dict[str, Any] | None,
    *,
    slide=None,
    effects: list[dict[str, Any]] | None = None,
) -> None:
    if not fill or fill.get("type") in {None, "none"}:
        pptx_shape.fill.background()
        return
    color = _hex_color(fill.get("color"))
    if (
        fill.get("type") == "picture"
        and slide is not None
        and _apply_picture_fill(pptx_shape, fill, slide, effects=effects)
    ):
        return
    if fill.get("type") == "gradient" and _apply_gradient_fill(pptx_shape, fill):
        return
    if fill.get("type") == "solid" and color:
        pptx_shape.fill.solid()
        pptx_shape.fill.fore_color.rgb = color
        _apply_solid_alpha(pptx_shape, fill.get("alpha"))
    else:
        pptx_shape.fill.background()

_apply_fill.__module__ = 'pptx2html.server.pptx_writer'
