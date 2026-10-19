# Origin: pptx_pipeline.py::_validate_self_contained_presentation_resources
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import _EXTERNAL_RESOURCE_SCHEME_PATTERN
from doe_export.pipeline.assets._validate_embedded_svg_resource import _validate_embedded_svg_resource

def _validate_self_contained_presentation_resources(
    presentation_ir: dict[str, Any],
) -> None:
    def validate_image(image: dict[str, Any], path: str) -> None:
        url = image.get("url")
        if isinstance(url, str) and url.strip() and not url.lstrip().lower().startswith("data:"):
            raise ValueError(
                f"{path}.url is not embedded; HTML export cannot depend on external resources."
            )
        for field in ("data", "preview_data"):
            value = image.get(field)
            if not isinstance(value, str) or not value.strip():
                continue
            if _EXTERNAL_RESOURCE_SCHEME_PATTERN.match(value) or value.lstrip().lower().startswith(
                "yrkie-asset-"
            ):
                raise ValueError(
                    f"{path}.{field} is not hydrated; HTML export requires embedded resource bytes."
                )
        _validate_embedded_svg_resource(image, path, "data", "content_type")
        _validate_embedded_svg_resource(
            image,
            path,
            "preview_data",
            "preview_content_type",
        )

    def visit(value: Any, path: str) -> None:
        if isinstance(value, dict):
            image = value.get("image")
            if isinstance(image, dict):
                validate_image(image, f"{path}.image")
            fonts = value.get("embedded_fonts")
            if isinstance(fonts, list):
                for index, font in enumerate(fonts):
                    if not isinstance(font, dict):
                        continue
                    data = font.get("data")
                    if isinstance(data, str) and (
                        _EXTERNAL_RESOURCE_SCHEME_PATTERN.match(data)
                        or data.lstrip().lower().startswith(("data:", "yrkie-asset-"))
                    ):
                        raise ValueError(
                            f"{path}.embedded_fonts[{index}].data is not hydrated "
                            "as base64 font bytes."
                        )
            for key, item in value.items():
                visit(item, f"{path}.{key}")
        elif isinstance(value, list):
            for index, item in enumerate(value):
                visit(item, f"{path}[{index}]")

    visit(presentation_ir, "presentation")

_validate_self_contained_presentation_resources.__module__ = 'pptx_pipeline'
