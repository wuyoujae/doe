# Origin: pptx2html/server/pptx_writer.py::_apply_picture_fill
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import has_image_payload
from doe_export.pptx.writer.assets._add_image_part import _add_image_part
from doe_export.pptx.writer.shape._build_blip_fill import _build_blip_fill
from doe_export.pptx.writer.shape._clear_fill_children import _clear_fill_children
from doe_export.pptx.writer.shape._insert_before_line_or_append import _insert_before_line_or_append
from doe_export.pptx.writer.shape._shape_sp_pr import _shape_sp_pr

def _apply_picture_fill(
    pptx_shape,
    fill: dict[str, Any],
    slide,
    *,
    effects: list[dict[str, Any]] | None = None,
) -> bool:
    image = fill.get("image") or {}
    if not has_image_payload(image):
        return False
    rel_id = _add_image_part(slide, image)

    sp_pr = _shape_sp_pr(pptx_shape)
    _clear_fill_children(sp_pr)
    _insert_before_line_or_append(
        sp_pr,
        _build_blip_fill(
            rel_id,
            image,
            fill_alpha=fill.get("alpha"),
            effects=effects,
        ),
    )
    return True

_apply_picture_fill.__module__ = 'pptx2html.server.pptx_writer'
