# Origin: pptx_pipeline.py::_validate_rendered_html_resources
from __future__ import annotations
from doe_export.pipeline.shared import _EXTERNAL_CSS_RESOURCE_PATTERN, _RESOURCE_ELEMENT_PATTERN, _STYLE_ATTRIBUTE_PATTERN, _STYLE_BLOCK_PATTERN

def _validate_rendered_html_resources(html: str) -> None:
    if _RESOURCE_ELEMENT_PATTERN.search(html):
        raise ValueError(
            "Canonical HTML contains an external media source; export is not self-contained."
        )
    style_sources = [
        *(match.group("css") for match in _STYLE_BLOCK_PATTERN.finditer(html)),
        *(match.group("css") for match in _STYLE_ATTRIBUTE_PATTERN.finditer(html)),
    ]
    if any(_EXTERNAL_CSS_RESOURCE_PATTERN.search(css) for css in style_sources):
        raise ValueError(
            "Canonical HTML contains an external CSS resource; export is not self-contained."
        )

_validate_rendered_html_resources.__module__ = 'pptx_pipeline'
