# Origin: htmlir_server.py::_validate_presentation
from __future__ import annotations
from doe_export.service.shared import Any, MAX_PRESENTATION_SLIDES

def _validate_presentation(presentation: dict[str, Any]) -> None:
    slides = presentation.get("slides")
    if not isinstance(slides, list) or not 1 <= len(slides) <= MAX_PRESENTATION_SLIDES:
        raise ValueError(
            f"presentation.slides must contain between 1 and {MAX_PRESENTATION_SLIDES} slides."
        )

_validate_presentation.__module__ = 'htmlir_server'
