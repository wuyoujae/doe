# Origin: pptx2html/ir/builder.py::PresentationBuilder._svg_intrinsic_size_pt
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, re

@classmethod
def _svg_intrinsic_size_pt(
    cls,
    blob: bytes,
    dpi_override: Optional[float],
) -> tuple[Optional[float], Optional[float]]:
    try:
        text = blob.decode("utf-8-sig")
    except UnicodeDecodeError:
        return None, None
    tag_match = re.search(r"<svg\b[^>]*>", text, flags=re.IGNORECASE)
    if tag_match is None:
        return None, None
    tag = tag_match.group(0)

    def attribute(name: str) -> Optional[str]:
        match = re.search(
            rf"\s{name}\s*=\s*(['\"])(.*?)\1",
            tag,
            flags=re.IGNORECASE,
        )
        return match.group(2) if match is not None else None

    width = cls._svg_length_pt(attribute("width"), dpi_override)
    height = cls._svg_length_pt(attribute("height"), dpi_override)
    if width is not None and height is not None:
        return width, height
    view_box = attribute("viewBox")
    if view_box:
        try:
            parts = [float(value) for value in re.split(r"[\s,]+", view_box.strip()) if value]
        except ValueError:
            parts = []
        if len(parts) == 4 and parts[2] > 0 and parts[3] > 0:
            px_to_pt = 72.0 / (dpi_override or 96.0)
            return width or parts[2] * px_to_pt, height or parts[3] * px_to_pt
    return width, height

_svg_intrinsic_size_pt.__func__.__module__ = 'pptx2html.ir.builder'
_svg_intrinsic_size_pt.__func__.__qualname__ = 'PresentationBuilder._svg_intrinsic_size_pt'
