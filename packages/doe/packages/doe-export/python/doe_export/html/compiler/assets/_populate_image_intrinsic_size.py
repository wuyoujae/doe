# Origin: pptx2html/htmlir/compiler.py::_populate_image_intrinsic_size
from __future__ import annotations
from doe_export.html.compiler.shared import ImageInfo
from doe_export.html.compiler.shared import BytesIO, PILImage, dataclasses, image_payload
from doe_export.html.compiler.document._positive_finite_number import _positive_finite_number
from doe_export.html.compiler.svg._svg_payload_intrinsic_size_pt import _svg_payload_intrinsic_size_pt

def _populate_image_intrinsic_size(image: ImageInfo, payload: bytes | None = None) -> None:
    content_type = image.content_type
    try:
        if payload is None:
            payload, content_type = image_payload(dataclasses.asdict(image))
        with PILImage.open(BytesIO(payload)) as source:
            width, height = source.size
            dpi = source.info.get("dpi") or (96.0, 96.0)
            if isinstance(dpi, (tuple, list)) and dpi:
                dpi_x = _positive_finite_number(dpi[0]) or 96.0
                dpi_y = _positive_finite_number(dpi[1] if len(dpi) > 1 else dpi[0]) or dpi_x
            else:
                dpi_x = dpi_y = _positive_finite_number(dpi) or 96.0
            image.intrinsic_width_pt = width * 72.0 / dpi_x
            image.intrinsic_height_pt = height * 72.0 / dpi_y
            return
    except Exception:
        pass

    if str(content_type or image.content_type or "").lower() not in {"image/svg", "image/svg+xml"}:
        return
    svg_size = _svg_payload_intrinsic_size_pt(payload)
    if svg_size is not None:
        image.intrinsic_width_pt, image.intrinsic_height_pt = svg_size

_populate_image_intrinsic_size.__module__ = 'pptx2html.htmlir.compiler'
