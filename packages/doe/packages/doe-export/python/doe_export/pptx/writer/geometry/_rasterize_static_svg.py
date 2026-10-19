# Origin: pptx2html/server/pptx_writer.py::_rasterize_static_svg
from __future__ import annotations
from doe_export.pptx.writer.shared import ET, MAX_IMAGE_PAYLOAD_BYTES, PILImage, SVG_NAMESPACE, UnidentifiedImageError, io, parse_xml
from doe_export.pptx.writer.geometry._svg_raster_dimensions import _svg_raster_dimensions

def _rasterize_static_svg(svg_data: bytes) -> bytes:
    root = parse_xml(svg_data, max_bytes=MAX_IMAGE_PAYLOAD_BYTES)
    if str(root.tag).rsplit("}", 1)[-1].lower() != "svg":
        raise ValueError("SVG image payload must have an <svg> root element")
    width, height = _svg_raster_dimensions(root)
    ET.register_namespace("", SVG_NAMESPACE)
    svg_markup = ET.tostring(root, encoding="unicode")
    source = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
html, body {{ margin: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }}
svg {{ display: block; width: 100% !important; height: 100% !important; }}
</style>
</head>
<body>{svg_markup}</body>
</html>"""
    try:
        from pptx2html.htmlir.compiler import capture_html_screenshots

        png = capture_html_screenshots(
            [{"source": source}],
            viewport=(width, height),
            device_scale_factor=1.0,
            timeout_ms=30000,
            concurrency=1,
            omit_background=True,
        )[0]
        if len(png) > MAX_IMAGE_PAYLOAD_BYTES:
            raise ValueError("Rasterized SVG exceeds the 32 MiB image limit")
        with PILImage.open(io.BytesIO(png)) as raster:
            raster.load()
            if raster.format != "PNG" or raster.size != (width, height):
                raise ValueError("SVG rasterizer returned an invalid PNG size")
            # Chromium may encode fully opaque screenshots as RGB PNGs. Keep the
            # original bytes so transparent screenshots retain their exact alpha.
    except (OSError, UnidentifiedImageError, IndexError) as error:
        raise ValueError("Static SVG could not be rasterized for source-free PPTX export") from error
    return png

_rasterize_static_svg.__module__ = 'pptx2html.server.pptx_writer'
