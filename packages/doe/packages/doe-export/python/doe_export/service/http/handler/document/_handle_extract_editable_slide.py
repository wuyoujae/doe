# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_extract_editable_slide
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import extract_editable_slide_html

def _handle_extract_editable_slide(self) -> None:
    try:
        payload = self._read_json()
        canonical_html = payload.get("canonical_html")
        if not isinstance(canonical_html, str):
            raise ValueError("Expected JSON field 'canonical_html' as a string.")
        known_asset_ids = payload.get("known_asset_ids") or []
        if not isinstance(known_asset_ids, list) or not all(
            isinstance(value, str) for value in known_asset_ids
        ):
            raise ValueError("known_asset_ids must be an array of strings.")
        slide_position = payload.get("slide_position", 0)
        if not isinstance(slide_position, int) or isinstance(slide_position, bool):
            raise ValueError("slide_position must be an integer.")
        presentation_assets = payload.get("presentation_assets") or {}
        if not isinstance(presentation_assets, dict):
            raise ValueError("presentation_assets must be an object.")
        result = extract_editable_slide_html(
            canonical_html,
            slide_position=slide_position,
            known_asset_ids=set(known_asset_ids),
            asset_payloads=presentation_assets,
        )
    except ValueError as error:
        self._send_json({"success": False, "error": str(error)}, HTTPStatus.BAD_REQUEST)
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_json(result)

_handle_extract_editable_slide.__module__ = 'htmlir_server'
_handle_extract_editable_slide.__qualname__ = 'HtmlIrRequestHandler._handle_extract_editable_slide'
