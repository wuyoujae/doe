"""Image payload helpers shared by PPTX writers."""

from __future__ import annotations

import base64
import binascii
import io
import re
from typing import Any
from urllib.parse import unquote_to_bytes

from PIL import Image as PILImage
from PIL import UnidentifiedImageError
from pptx2html.ooxml.safe_xml import parse_xml

MAX_IMAGE_PAYLOAD_BYTES = 32 * 1024 * 1024
MAX_IMAGE_ENCODED_BYTES = ((MAX_IMAGE_PAYLOAD_BYTES + 2) // 3) * 4
MAX_IMAGE_PIXELS = 40_000_000
PPTX_NATIVE_IMAGE_TYPES = {
    "GIF": "image/gif",
    "JPEG": "image/jpeg",
    "PNG": "image/png",
}
RASTER_IMAGE_CONTENT_TYPES = {
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/tiff",
    "image/webp",
}
SVG_IMAGE_CONTENT_TYPES = {"image/svg", "image/svg+xml"}
FORBIDDEN_SVG_ELEMENTS = {
    "animate",
    "animatemotion",
    "animatetransform",
    "discard",
    "feimage",
    "foreignobject",
    "script",
    "set",
}
ACTIVE_SVG_URL = re.compile(r"^(?:javascript|vbscript|file|filesystem|ftp|https?|ws|wss):", re.I)
ACTIVE_SVG_CSS = re.compile(
    r"(?:@import\s+|url\s*\(\s*['\"]?\s*(?:javascript|vbscript|file|filesystem|ftp|https?|ws|wss):)",
    re.I,
)
SVG_PREFIX = re.compile(br"^\s*(?:<\?xml[^>]*>\s*)?<svg\b", re.I)


def has_image_payload(image: dict[str, Any] | None) -> bool:
    if not image:
        return False
    return bool(image.get("data") or image.get("url"))


def image_payload(image: dict[str, Any]) -> tuple[bytes, str]:
    """Return bounded image bytes from inline base64 data or a data URL."""

    content_type = str(image.get("content_type") or "application/octet-stream").lower()
    data = image.get("data")
    if data:
        if not isinstance(data, str):
            raise ValueError("image.data must be a base64 string")
        return _validated_image_payload(_decode_base64(data), content_type)

    url = image.get("url")
    if not url:
        return b"", content_type
    if not isinstance(url, str):
        raise ValueError("image.url must be a string")
    if url.startswith("data:"):
        return _data_url_payload(url, content_type)
    raise ValueError("image.url only accepts a bounded data URL; file and network URLs are forbidden")


def _data_url_payload(url: str, fallback_content_type: str) -> tuple[bytes, str]:
    header, separator, payload = url.partition(",")
    if not separator:
        raise ValueError("Malformed image data URL")
    metadata = header.removeprefix("data:")
    parts = [part for part in metadata.split(";") if part]
    content_type = (parts[0] if parts and "/" in parts[0] else fallback_content_type).lower()
    if not content_type.startswith("image/"):
        raise ValueError("Image data URLs must use an image content type")
    if any(part.lower() == "base64" for part in parts[1:] if part):
        decoded = _decode_base64(payload)
    else:
        if len(payload.encode("utf-8")) > MAX_IMAGE_PAYLOAD_BYTES * 3:
            raise ValueError("Image data URL exceeds the encoded size limit")
        decoded = unquote_to_bytes(payload)
    return _validated_image_payload(decoded, content_type)


def _decode_base64(value: str) -> bytes:
    try:
        encoded = value.encode("ascii", errors="strict")
    except UnicodeEncodeError as error:
        raise ValueError("Image base64 data is invalid") from error
    if len(encoded) > MAX_IMAGE_ENCODED_BYTES + 4:
        raise ValueError("Image base64 data exceeds the encoded size limit")
    try:
        return base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error) as error:
        raise ValueError("Image base64 data is invalid") from error


def _validated_image_payload(payload: bytes, content_type: str) -> tuple[bytes, str]:
    if not payload:
        raise ValueError("Image payload is empty")
    if len(payload) > MAX_IMAGE_PAYLOAD_BYTES:
        raise ValueError("Image payload exceeds the 32 MiB limit")

    try:
        with PILImage.open(io.BytesIO(payload)) as image:
            width, height = image.size
            if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
                raise ValueError(f"Image cannot exceed {MAX_IMAGE_PIXELS} decoded pixels")
            image_format = (image.format or "").upper()
            if image_format in PPTX_NATIVE_IMAGE_TYPES:
                content_type = PPTX_NATIVE_IMAGE_TYPES[image_format]
    except PILImage.DecompressionBombError as error:
        raise ValueError(f"Image cannot exceed {MAX_IMAGE_PIXELS} decoded pixels") from error
    except UnidentifiedImageError as error:
        if content_type in RASTER_IMAGE_CONTENT_TYPES:
            raise ValueError("Image payload is not a valid raster image") from error

    if content_type in SVG_IMAGE_CONTENT_TYPES or SVG_PREFIX.match(payload[:4_096]):
        _validate_static_svg(payload)
        content_type = "image/svg+xml"

    return payload, content_type


def _validate_static_svg(payload: bytes) -> None:
    root = parse_xml(
        payload,
        max_bytes=MAX_IMAGE_PAYLOAD_BYTES,
        max_nodes=50_000,
        max_depth=64,
        max_text_chars=8 * 1024 * 1024,
        max_attributes=100_000,
    )
    for element in root.iter():
        local_name = str(element.tag).rsplit("}", 1)[-1].lower()
        if local_name in FORBIDDEN_SVG_ELEMENTS:
            raise ValueError(f"SVG element <{local_name}> is not allowed")
        for raw_name, raw_value in element.attrib.items():
            name = raw_name.rsplit("}", 1)[-1].lower()
            value = str(raw_value).strip().replace("\x00", "")
            if name.startswith("on"):
                raise ValueError("SVG event handler attributes are not allowed")
            if ACTIVE_SVG_URL.match(value) or ACTIVE_SVG_CSS.search(value):
                raise ValueError("SVG external or active URLs are not allowed")
            if local_name == "use" and name == "href" and not value.startswith("#"):
                raise ValueError("SVG use references must remain in the same document")
        if local_name == "style" and ACTIVE_SVG_CSS.search(element.text or ""):
            raise ValueError("SVG styles cannot contain external or active URLs")
