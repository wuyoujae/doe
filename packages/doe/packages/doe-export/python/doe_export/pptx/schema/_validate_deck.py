# Origin: schema_v4_export.py::_validate_deck
from __future__ import annotations
from .shared import Any, MAX_SLIDES, SchemaV4ExportError

def _validate_deck(deck: dict[str, Any]) -> list[dict[str, Any]]:
    if int(deck.get("version") or 0) != 4:
        raise SchemaV4ExportError("Schema v4 export requires Deck version 4.")
    deck_body = deck.get("deck")
    slides = deck_body.get("slides") if isinstance(deck_body, dict) else None
    if not isinstance(slides, list) or not 1 <= len(slides) <= MAX_SLIDES:
        raise SchemaV4ExportError(
            f"Schema Deck must contain between 1 and {MAX_SLIDES} slides."
        )
    if any(not isinstance(slide, dict) for slide in slides):
        raise SchemaV4ExportError("Every Schema Deck slide must be an object.")
    return slides

_validate_deck.__module__ = 'schema_v4_export'
