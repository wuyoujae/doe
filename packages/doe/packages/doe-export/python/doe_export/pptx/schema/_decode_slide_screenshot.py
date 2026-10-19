# Origin: schema_v4_export.py::_decode_slide_screenshot
from __future__ import annotations
from .shared import Any, Image, MAX_SCREENSHOT_BYTES, SCREENSHOT_HEIGHT_PX, SCREENSHOT_WIDTH_PX, SchemaV4ExportError, base64, binascii, io

def _decode_slide_screenshot(value: Any, slide_number: int) -> bytes:
    if not isinstance(value, str) or not value:
        raise SchemaV4ExportError(
            f"Schema v4 slide {slide_number} has no browser screenshot."
        )
    if len(value) > ((MAX_SCREENSHOT_BYTES + 2) // 3) * 4:
        raise SchemaV4ExportError(
            f"Schema v4 slide {slide_number} screenshot is too large."
        )
    try:
        payload = base64.b64decode(value, validate=True)
    except (ValueError, binascii.Error) as error:
        raise SchemaV4ExportError(
            f"Schema v4 slide {slide_number} screenshot is invalid."
        ) from error
    if not payload or len(payload) > MAX_SCREENSHOT_BYTES:
        raise SchemaV4ExportError(
            f"Schema v4 slide {slide_number} screenshot is invalid."
        )
    try:
        with Image.open(io.BytesIO(payload)) as image:
            image.verify()
        with Image.open(io.BytesIO(payload)) as image:
            if image.format != "PNG" or image.size != (
                SCREENSHOT_WIDTH_PX,
                SCREENSHOT_HEIGHT_PX,
            ):
                raise SchemaV4ExportError(
                    f"Schema v4 slide {slide_number} screenshot must be a "
                    f"{SCREENSHOT_WIDTH_PX}x{SCREENSHOT_HEIGHT_PX} PNG."
                )
    except SchemaV4ExportError:
        raise
    except (OSError, ValueError) as error:
        raise SchemaV4ExportError(
            f"Schema v4 slide {slide_number} screenshot is invalid."
        ) from error
    return payload

_decode_slide_screenshot.__module__ = 'schema_v4_export'
