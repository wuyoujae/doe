# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._image_intrinsic_size_pt
from __future__ import annotations
from doe_export.html.renderer.shared import BytesIO, Image, math

def _image_intrinsic_size_pt(self, image) -> tuple[float, float]:
    explicit_width = self._finite_float(getattr(image, "intrinsic_width_pt", None))
    explicit_height = self._finite_float(getattr(image, "intrinsic_height_pt", None))
    if explicit_width > 0 and explicit_height > 0:
        return explicit_width, explicit_height
    raw = self._inline_image_bytes(image)
    if not raw:
        return max(0.0, explicit_width), max(0.0, explicit_height)
    try:
        with Image.open(BytesIO(raw)) as source:
            dpi = source.info.get("dpi") or (96.0, 96.0)
            if isinstance(dpi, (int, float)):
                dpi_x = dpi_y = float(dpi)
            else:
                dpi_x = float(dpi[0] or 96.0)
                dpi_y = float(dpi[1] or dpi_x or 96.0)
            dpi_x = dpi_x if math.isfinite(dpi_x) and dpi_x > 0 else 96.0
            dpi_y = dpi_y if math.isfinite(dpi_y) and dpi_y > 0 else 96.0
            return (
                explicit_width if explicit_width > 0 else source.width * 72.0 / dpi_x,
                explicit_height if explicit_height > 0 else source.height * 72.0 / dpi_y,
            )
    except Exception:
        return max(0.0, explicit_width), max(0.0, explicit_height)

_image_intrinsic_size_pt.__module__ = 'pptx2html.renderer.html_renderer'
_image_intrinsic_size_pt.__qualname__ = 'HtmlRenderer._image_intrinsic_size_pt'
