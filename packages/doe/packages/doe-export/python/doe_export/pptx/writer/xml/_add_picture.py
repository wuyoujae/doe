# Origin: pptx2html/server/pptx_writer.py::_add_picture
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import Path, tempfile
from doe_export.pptx.writer.shape._apply_line import _apply_line
from doe_export.pptx.writer.xml._apply_picture_crop_and_alpha import _apply_picture_crop_and_alpha
from doe_export.pptx.writer.xml._apply_picture_effects import _apply_picture_effects
from doe_export.pptx.writer.shape._apply_shadow import _apply_shadow
from doe_export.pptx.writer.assets._image_suffix import _image_suffix
from doe_export.pptx.writer.assets._merged_image_effects import _merged_image_effects
from doe_export.pptx.writer.package._source_free_export_ready_image_payload import _source_free_export_ready_image_payload

def _add_picture(slide, shape: dict[str, Any], left, top, width, height, temp_files: list[Path]):
    image = shape.get("image") or {}
    data, content_type = _source_free_export_ready_image_payload(image)
    suffix = _image_suffix(content_type)
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as handle:
        handle.write(data)
        temp_path = Path(handle.name)
    temp_files.append(temp_path)
    picture = slide.shapes.add_picture(str(temp_path), left, top, width, height)
    if shape.get("rotation"):
        picture.rotation = float(shape.get("rotation") or 0)
    _apply_picture_crop_and_alpha(picture, image)
    _apply_picture_effects(
        picture,
        _merged_image_effects(image.get("effects"), shape.get("effects")),
    )
    _apply_line(picture, shape.get("border"))
    _apply_shadow(picture, shape.get("shadow"))
    return picture

_add_picture.__module__ = 'pptx2html.server.pptx_writer'
