# Origin: pptx2html/server/ooxml_pptx_writer.py::export_ready_image_payload
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import MAX_IMAGE_PAYLOAD_BYTES, PILImage, PPTX_NATIVE_IMAGE_TYPES, UnidentifiedImageError, image_payload, io

def export_ready_image_payload(image: dict[str, Any]) -> tuple[bytes, str]:
    """Return an Office-compatible image payload.

    PowerPoint and ``python-pptx`` do not consistently accept browser-native
    raster formats such as WebP. Keep native PNG/JPEG/GIF bytes byte-for-byte,
    but losslessly normalize other raster formats to PNG at the writer edge.
    Static SVG payloads are left untouched for the native OOXML writer.
    """

    data, content_type = image_payload(image)
    try:
        with PILImage.open(io.BytesIO(data)) as source:
            image_format = (source.format or "").upper()
            native_content_type = PPTX_NATIVE_IMAGE_TYPES.get(image_format)
            if native_content_type:
                return data, native_content_type

            source.seek(0)
            source.load()
            has_alpha = source.mode in {"RGBA", "LA"} or (
                source.mode == "P" and "transparency" in source.info
            )
            converted = source.convert("RGBA" if has_alpha else "RGB")
            output = io.BytesIO()
            save_options: dict[str, Any] = {}
            dpi = source.info.get("dpi")
            if isinstance(dpi, (tuple, list)) and len(dpi) >= 2:
                try:
                    dpi_pair = (float(dpi[0]), float(dpi[1]))
                    if all(1.0 <= value <= 2400.0 for value in dpi_pair):
                        save_options["dpi"] = dpi_pair
                except (TypeError, ValueError):
                    pass
            converted.save(output, format="PNG", **save_options)
    except UnidentifiedImageError:
        # image_payload() normalizes every validated static SVG declaration to
        # this content type. Anything else would become an unreadable media
        # part, so fail the export instead of silently producing a broken PPTX.
        if content_type == "image/svg+xml":
            return data, content_type
        raise ValueError("Image payload format is not supported for PPTX export")

    normalized = output.getvalue()
    if len(normalized) > MAX_IMAGE_PAYLOAD_BYTES:
        raise ValueError("Office-compatible image payload exceeds the 32 MiB limit")
    return normalized, "image/png"

export_ready_image_payload.__module__ = 'pptx2html.server.ooxml_pptx_writer'
