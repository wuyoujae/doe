# Origin: pptx_pipeline.py::_transparent_svg_placeholder
from __future__ import annotations

def _transparent_svg_placeholder() -> bytes:
    return (
        b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">'
        b'<rect width="1" height="1" fill="transparent"/></svg>'
    )

_transparent_svg_placeholder.__module__ = 'pptx_pipeline'
