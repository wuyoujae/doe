# Origin: pptx2html/htmlir/compiler.py::_apply_cover_crop
from __future__ import annotations
from doe_export.html.compiler.shared import ImageInfo

def _apply_cover_crop(
    image: ImageInfo,
    natural_width: float,
    natural_height: float,
    box_width: float,
    box_height: float,
    position_x: float,
    position_y: float,
) -> None:
    if natural_width <= 0 or natural_height <= 0 or box_width <= 0 or box_height <= 0:
        return
    image.crop_left = 0.0
    image.crop_right = 0.0
    image.crop_top = 0.0
    image.crop_bottom = 0.0
    image_aspect = natural_width / natural_height
    box_aspect = box_width / box_height
    if image_aspect > box_aspect:
        visible_fraction = box_aspect / image_aspect
        hidden = max(0.0, min(0.98, 1.0 - visible_fraction))
        image.crop_left = round(max(0.0, min(0.98, hidden * position_x)), 4)
        image.crop_right = round(max(0.0, min(0.98, hidden * (1.0 - position_x))), 4)
    elif image_aspect < box_aspect:
        visible_fraction = image_aspect / box_aspect
        hidden = max(0.0, min(0.98, 1.0 - visible_fraction))
        image.crop_top = round(max(0.0, min(0.98, hidden * position_y)), 4)
        image.crop_bottom = round(max(0.0, min(0.98, hidden * (1.0 - position_y))), 4)

_apply_cover_crop.__module__ = 'pptx2html.htmlir.compiler'
