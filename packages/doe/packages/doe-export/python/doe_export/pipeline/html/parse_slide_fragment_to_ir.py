# Origin: pptx_pipeline.py::parse_slide_fragment_to_ir
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import compile_slide_fragment
from doe_export.pipeline.html.normalize_slide_fragment import normalize_slide_fragment

def parse_slide_fragment_to_ir(fragment: str, **options: Any) -> dict[str, Any]:
    """Compile one validated Slide Agent fragment through the platform compiler shell."""

    return compile_slide_fragment(normalize_slide_fragment(fragment), **options)

parse_slide_fragment_to_ir.__module__ = 'pptx_pipeline'
