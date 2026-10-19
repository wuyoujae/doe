# Origin: htmlir_server.py::_thumbnail_webp_and_palette
from __future__ import annotations
from doe_export.service.shared import Image, MAX_PREVIEW_THUMBNAIL_EDGE, base64, io
from doe_export.service.thumbnail._preview_palette import _preview_palette

def _thumbnail_webp_and_palette(png: str | bytes) -> tuple[str, dict[str, str]]:
    source = io.BytesIO(base64.b64decode(png) if isinstance(png, str) else png)
    target = io.BytesIO()
    with Image.open(source) as image:
        thumbnail = image.convert("RGBA")
        thumbnail.thumbnail(
            (MAX_PREVIEW_THUMBNAIL_EDGE, MAX_PREVIEW_THUMBNAIL_EDGE),
            Image.Resampling.LANCZOS,
        )
        palette = _preview_palette(thumbnail)
        thumbnail.convert("RGB").save(
            target,
            format="WEBP",
            quality=82,
            method=4,
        )
    return base64.b64encode(target.getvalue()).decode("ascii"), palette

_thumbnail_webp_and_palette.__module__ = 'htmlir_server'
