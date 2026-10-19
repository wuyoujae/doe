# Origin: pptx2html/htmlir/compiler.py::_apply_background_image_geometry
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import ImageInfo
from doe_export.html.compiler.shared import CSS_PX_TO_PT
from doe_export.html.compiler.document._apply_cover_crop import _apply_cover_crop
from doe_export.html.compiler.document._background_axis_repeats import _background_axis_repeats
from doe_export.html.compiler.document._background_box_pixels import _background_box_pixels
from doe_export.html.compiler.document._background_rendered_fractions import _background_rendered_fractions
from doe_export.html.compiler.document._background_repeat_modes import _background_repeat_modes
from doe_export.html.compiler.document._background_tile_alignment import _background_tile_alignment
from doe_export.html.compiler.css._css_background_position_fractions import _css_background_position_fractions
from doe_export.html.compiler.assets._image_intrinsic_dimensions import _image_intrinsic_dimensions

def _apply_background_image_geometry(
    image: ImageInfo,
    node: dict[str, Any],
    bounds: Bounds | None,
    *,
    size: str,
    position: str,
    repeat: str,
) -> None:
    normalized_size = str(size or "auto").strip().lower()
    position_x, position_y = _css_background_position_fractions(position)
    natural_size = _image_intrinsic_dimensions(image)
    box_width_px, box_height_px = _background_box_pixels(node, bounds)

    if normalized_size == "cover":
        if natural_size is not None and bounds is not None:
            _apply_cover_crop(
                image,
                natural_size[0],
                natural_size[1],
                bounds.width,
                bounds.height,
                position_x,
                position_y,
            )
        # A cover image occupies the complete paint box, so CSS's default
        # ``repeat`` never produces another visible tile.
        image.tile = False
        return

    rendered = _background_rendered_fractions(
        normalized_size,
        natural_size,
        box_width_px,
        box_height_px,
    )
    if rendered is None:
        repeat_x, repeat_y = _background_repeat_modes(repeat)
        image.tile = repeat_x != "no-repeat" or repeat_y != "no-repeat"
        return

    rendered_width, rendered_height = rendered
    repeat_x, repeat_y = _background_repeat_modes(repeat)
    image.tile = _background_axis_repeats(repeat_x, rendered_width) or _background_axis_repeats(
        repeat_y, rendered_height
    )
    if image.tile:
        if natural_size is not None and bounds is not None:
            natural_width_pt = image.intrinsic_width_pt or natural_size[0] * CSS_PX_TO_PT
            natural_height_pt = image.intrinsic_height_pt or natural_size[1] * CSS_PX_TO_PT
            if natural_width_pt > 0:
                image.tile_scale_x = round(rendered_width * bounds.width / natural_width_pt, 6)
            if natural_height_pt > 0:
                image.tile_scale_y = round(rendered_height * bounds.height / natural_height_pt, 6)
        image.tile_align = _background_tile_alignment(position_x, position_y)
        return

    left = (1.0 - rendered_width) * position_x
    top = (1.0 - rendered_height) * position_y
    right = 1.0 - left - rendered_width
    bottom = 1.0 - top - rendered_height
    if any(abs(value) > 1e-6 for value in (left, right, top, bottom)):
        image.stretch_left = round(left, 6)
        image.stretch_right = round(right, 6)
        image.stretch_top = round(top, 6)
        image.stretch_bottom = round(bottom, 6)

_apply_background_image_geometry.__module__ = 'pptx2html.htmlir.compiler'
