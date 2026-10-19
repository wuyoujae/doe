# Origin: pptx_pipeline.py::parse_html_to_presentation_ir
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.html.parse_html_to_ir import parse_html_to_ir

def parse_html_to_presentation_ir(html: str, **options: Any) -> dict[str, Any]:
    """Parse ordinary HTML/CSS and return only the PresentationIR object."""

    return parse_html_to_ir(html, **options)["presentation"]

parse_html_to_presentation_ir.__module__ = 'pptx_pipeline'
