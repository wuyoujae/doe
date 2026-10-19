# Origin: pptx_pipeline.py::_validate_embedded_svg_resource
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import _EXTERNAL_CSS_RESOURCE_PATTERN, _SVG_EXTERNAL_RESOURCE_PATTERN, base64, binascii, unquote_to_bytes

def _validate_embedded_svg_resource(
    image: dict[str, Any],
    path: str,
    data_field: str,
    content_type_field: str,
) -> None:
    if str(image.get(content_type_field) or "").strip().lower() != "image/svg+xml":
        return
    encoded = image.get(data_field)
    if not isinstance(encoded, str) or not encoded.strip():
        return
    source = encoded.strip()
    if source.lower().startswith("data:image/svg+xml"):
        _, separator, source = source.partition(",")
        if not separator:
            raise ValueError(f"{path}.{data_field} contains an invalid SVG data URL.")
        if ";base64" not in encoded[: encoded.find(",")].lower():
            source = unquote_to_bytes(source).decode("utf-8")
        else:
            source = base64.b64decode(source, validate=True).decode("utf-8")
    else:
        try:
            source = base64.b64decode(source, validate=True).decode("utf-8")
        except (binascii.Error, UnicodeDecodeError, ValueError) as error:
            raise ValueError(
                f"{path}.{data_field} contains invalid embedded SVG bytes."
            ) from error
    if _SVG_EXTERNAL_RESOURCE_PATTERN.search(source) or _EXTERNAL_CSS_RESOURCE_PATTERN.search(
        source
    ):
        raise ValueError(
            f"{path}.{data_field} contains an external SVG resource; "
            "HTML export requires a self-contained asset."
        )

_validate_embedded_svg_resource.__module__ = 'pptx_pipeline'
