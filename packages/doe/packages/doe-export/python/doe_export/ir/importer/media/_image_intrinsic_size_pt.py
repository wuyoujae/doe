# Origin: pptx2html/ir/builder.py::PresentationBuilder._image_intrinsic_size_pt
from __future__ import annotations
from doe_export.ir.importer.shared import BytesIO, Image, Optional, _SVG_CONTENT_TYPES

@classmethod
def _image_intrinsic_size_pt(
    cls,
    content_type: str,
    blob: bytes,
    dpi_override: object = None,
) -> tuple[Optional[float], Optional[float]]:
    if not blob:
        return None, None
    override = cls._positive_finite_float(dpi_override)
    if (content_type or "").lower() in _SVG_CONTENT_TYPES:
        return cls._svg_intrinsic_size_pt(blob, override)
    if Image is None:
        return None, None
    try:
        with Image.open(BytesIO(blob)) as source:
            width, height = source.size
            if width <= 0 or height <= 0:
                return None, None
            dpi_x = dpi_y = override
            if dpi_x is None:
                dpi = source.info.get("dpi")
                if isinstance(dpi, (tuple, list)) and dpi:
                    dpi_x = cls._positive_finite_float(dpi[0])
                    dpi_y = cls._positive_finite_float(dpi[1] if len(dpi) > 1 else dpi[0])
                else:
                    dpi_x = dpi_y = cls._positive_finite_float(dpi)
            dpi_x = dpi_x or 96.0
            dpi_y = dpi_y or dpi_x
            return width * 72.0 / dpi_x, height * 72.0 / dpi_y
    except Exception:
        return None, None

_image_intrinsic_size_pt.__func__.__module__ = 'pptx2html.ir.builder'
_image_intrinsic_size_pt.__func__.__qualname__ = 'PresentationBuilder._image_intrinsic_size_pt'
