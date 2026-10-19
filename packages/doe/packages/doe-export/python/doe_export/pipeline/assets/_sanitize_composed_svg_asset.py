# Origin: pptx_pipeline.py::_sanitize_composed_svg_asset
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import ET, _ACTIVE_SVG_TAGS, _ASSET_REFERENCE_PATTERN, _SAFE_RASTER_DATA_URL_PATTERN, _TRANSPARENT_PIXEL_DATA_URL, base64, binascii
from doe_export.pipeline.assets._svg_css_is_unsafe import _svg_css_is_unsafe
from doe_export.pipeline.assets._svg_local_name import _svg_local_name
from doe_export.pipeline.assets._transparent_svg_placeholder import _transparent_svg_placeholder

def _sanitize_composed_svg_asset(
    raw: bytes,
    assets: dict[str, dict[str, Any]],
    diagnostics: list[dict[str, str]],
    *,
    _depth: int = 0,
) -> bytes:
    """Make a percent-encoded renderer SVG passive and self-contained."""

    if len(raw) > 16 * 1024 * 1024:
        diagnostics.append(
            {
                "severity": "warning",
                "code": "svg-resource-replaced",
                "message": "An oversized composed SVG was replaced by a placeholder.",
            }
        )
        return _transparent_svg_placeholder()
    try:
        text = raw.decode("utf-8")
        root = ET.fromstring(text)
    except (UnicodeDecodeError, ET.ParseError):
        diagnostics.append(
            {
                "severity": "warning",
                "code": "svg-resource-replaced",
                "message": "A malformed composed SVG was replaced by a placeholder.",
            }
        )
        return _transparent_svg_placeholder()
    if _svg_local_name(root.tag) != "svg":
        diagnostics.append(
            {
                "severity": "warning",
                "code": "svg-resource-replaced",
                "message": "A non-SVG data resource was replaced by a placeholder.",
            }
        )
        return _transparent_svg_placeholder()

    sanitized = False

    def sanitize_children(parent: ET.Element) -> None:
        nonlocal sanitized
        for child in list(parent):
            if _svg_local_name(child.tag) in _ACTIVE_SVG_TAGS:
                parent.remove(child)
                sanitized = True
                continue
            sanitize_children(child)

    sanitize_children(root)
    for element in root.iter():
        for name in list(element.attrib):
            local_name = _svg_local_name(name)
            value = str(element.attrib.get(name) or "")
            if local_name.startswith("on"):
                del element.attrib[name]
                sanitized = True
                continue
            if local_name in {"href", "src"}:
                match = _ASSET_REFERENCE_PATTERN.fullmatch(value.strip())
                if match is not None:
                    asset_id = match.group("asset_id").lower()
                    asset = assets.get(asset_id)
                    if asset is None:
                        element.attrib[name] = _TRANSPARENT_PIXEL_DATA_URL
                        diagnostics.append(
                            {
                                "severity": "warning",
                                "code": "svg-nested-asset-missing",
                                "message": (
                                    "A composed SVG image dependency was unavailable "
                                    "and was replaced by a transparent placeholder."
                                ),
                            }
                        )
                    elif str(asset.get("content_type") or "").lower() == "image/svg+xml":
                        if _depth >= 3:
                            element.attrib[name] = _TRANSPARENT_PIXEL_DATA_URL
                        else:
                            try:
                                nested_raw = base64.b64decode(
                                    str(asset.get("data_base64") or ""),
                                    validate=True,
                                )
                            except (ValueError, binascii.Error):
                                nested_raw = _transparent_svg_placeholder()
                            nested_svg = _sanitize_composed_svg_asset(
                                nested_raw,
                                assets,
                                diagnostics,
                                _depth=_depth + 1,
                            )
                            element.attrib[name] = (
                                "data:image/svg+xml;base64,"
                                + base64.b64encode(nested_svg).decode("ascii")
                            )
                    elif str(asset.get("content_type") or "").lower() in {
                        "image/png",
                        "image/jpeg",
                        "image/jpg",
                        "image/gif",
                        "image/webp",
                        "image/bmp",
                        "image/avif",
                    }:
                        element.attrib[name] = (
                            f"data:{asset['content_type']};base64,{asset['data_base64']}"
                        )
                    else:
                        element.attrib[name] = _TRANSPARENT_PIXEL_DATA_URL
                        diagnostics.append(
                            {
                                "severity": "warning",
                                "code": "svg-nested-asset-replaced",
                                "message": (
                                    "An unsafe composed SVG dependency was "
                                    "replaced by a transparent placeholder."
                                ),
                            }
                        )
                    sanitized = True
                    continue
                normalized = value.strip().lower()
                if normalized and not (
                    normalized.startswith("#")
                    or _SAFE_RASTER_DATA_URL_PATTERN.fullmatch(value.strip())
                ):
                    element.attrib[name] = _TRANSPARENT_PIXEL_DATA_URL
                    sanitized = True
            if (
                local_name == "style"
                and _svg_css_is_unsafe(value)
            ):
                del element.attrib[name]
                sanitized = True
        if (
            _svg_local_name(element.tag) == "style"
            and isinstance(element.text, str)
            and _svg_css_is_unsafe(element.text)
        ):
            element.text = ""
            sanitized = True

    if sanitized:
        diagnostics.append(
            {
                "severity": "warning",
                "code": "svg-resource-sanitized",
                "message": "A composed SVG was sanitized for passive browser delivery.",
            }
        )
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    return ET.tostring(root, encoding="utf-8")

_sanitize_composed_svg_asset.__module__ = 'pptx_pipeline'
