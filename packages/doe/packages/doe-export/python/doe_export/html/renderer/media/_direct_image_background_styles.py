# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._direct_image_background_styles
from __future__ import annotations

def _direct_image_background_styles(
    self,
    image,
    src: str,
    width_pt: float,
    height_pt: float,
) -> list[str]:
    safe_src = self._css_url(src)
    if image.tile:
        intrinsic_w, intrinsic_h = self._image_intrinsic_size_pt(image)
        scale_x = max(0.001, abs(self._finite_float(image.tile_scale_x) or 1.0))
        scale_y = max(0.001, abs(self._finite_float(image.tile_scale_y) or 1.0))
        size_x = intrinsic_w * scale_x if intrinsic_w > 0 else max(0.001, width_pt)
        size_y = intrinsic_h * scale_y if intrinsic_h > 0 else max(0.001, height_pt)
        align = str(image.tile_align or "tl").lower()
        x = "50%" if align in {"t", "ctr", "b"} else ("100%" if align in {"tr", "r", "br"} else "0%")
        y = "50%" if align in {"l", "ctr", "r"} else ("100%" if align in {"bl", "b", "br"} else "0%")
        offset_x = self._finite_float(getattr(image, "tile_offset_x_pt", None))
        offset_y = self._finite_float(getattr(image, "tile_offset_y_pt", None))
        if offset_x:
            x = f"calc({x} + {offset_x:.6f}pt)"
        if offset_y:
            y = f"calc({y} + {offset_y:.6f}pt)"
        return [
            f"background-image:url('{safe_src}')",
            f"background-size:{size_x:.6f}pt {size_y:.6f}pt",
            f"background-position:{x} {y}",
            "background-repeat:repeat",
        ]

    image_x, image_y, image_w, image_h = self._image_placement(image)
    position_x = self._background_position_percent(image_x, image_w)
    position_y = self._background_position_percent(image_y, image_h)
    return [
        f"background-image:url('{safe_src}')",
        f"background-size:{image_w * 100.0:.8f}% {image_h * 100.0:.8f}%",
        f"background-position:{position_x:.8f}% {position_y:.8f}%",
        "background-repeat:no-repeat",
    ]

_direct_image_background_styles.__module__ = 'pptx2html.renderer.html_renderer'
_direct_image_background_styles.__qualname__ = 'HtmlRenderer._direct_image_background_styles'
