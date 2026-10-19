# Origin: pptx2html/htmlir/compiler.py::_image_intrinsic_dimensions
from __future__ import annotations
from doe_export.html.compiler.shared import ImageInfo
from doe_export.html.compiler.shared import BytesIO, PILImage, dataclasses, image_payload

def _image_intrinsic_dimensions(image: ImageInfo) -> tuple[float, float] | None:
    try:
        payload, _content_type = image_payload(dataclasses.asdict(image))
        with PILImage.open(BytesIO(payload)) as source:
            width, height = source.size
    except Exception:
        return None
    if width <= 0 or height <= 0:
        return None
    return float(width), float(height)

_image_intrinsic_dimensions.__module__ = 'pptx2html.htmlir.compiler'
