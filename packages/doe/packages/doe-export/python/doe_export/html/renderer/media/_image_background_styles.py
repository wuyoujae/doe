# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._image_background_styles
from __future__ import annotations
from doe_export.html.renderer.shared import base64, quote

def _image_background_styles(
    self,
    image,
    width_pt: float,
    height_pt: float,
    *,
    opacity_multiplier: float | None = None,
) -> list[str]:
    src = self._image_src(image)
    if not src:
        return self._missing_image_placeholder_styles()
    crop = self._normalized_crop(image)
    flip = str(getattr(image, "tile_flip", "") or "").lower()
    needs_composed_svg = (
        bool(self._image_effect_filter(image))
        or self._image_opacity(image, opacity_multiplier) < 0.999999
        or (bool(image.tile) and (any(crop) or flip not in {"", "none"}))
    )
    if not needs_composed_svg:
        return self._direct_image_background_styles(image, src, width_pt, height_pt)
    composed_src = src
    # A data-URL SVG has no reliable base URL for file-mode relative media.
    # Keep the original picture inline only for this composed wrapper so
    # opacity/cropped or mirrored tiling remains exact in standalone HTML.
    if self._mode == "file" and not src.startswith(
        ("data:", "yrkie-asset-", "http://", "https://")
    ):
        raw = self._inline_image_bytes(image)
        if raw:
            content_type = str(getattr(image, "content_type", "") or "image/png")
            composed_src = (
                f"data:{content_type};base64,{base64.b64encode(raw).decode('ascii')}"
            )
    svg = self._image_svg_document(
        image,
        width_pt,
        height_pt,
        opacity_multiplier=opacity_multiplier,
        source=composed_src,
    )
    # Keep managed-asset references literal inside a percent-encoded SVG.
    # Web can then expand `yrkie-asset-data://...` before Chromium renders
    # the HTML; a base64-encoded outer SVG would hide that reference.
    encoded = quote(svg, safe="/:;,+=")
    return [
        f"background-image:url('data:image/svg+xml,{encoded}')",
        "background-size:100% 100%",
        "background-position:0 0",
        "background-repeat:no-repeat",
    ]

_image_background_styles.__module__ = 'pptx2html.renderer.html_renderer'
_image_background_styles.__qualname__ = 'HtmlRenderer._image_background_styles'
