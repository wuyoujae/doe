# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_render_slide_document
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.validation._validate_presentation import _validate_presentation
from doe_export.service.shared import render_ir_to_slide_document

def _handle_render_slide_document(self) -> None:
    try:
        payload = self._read_json()
        presentation = payload.get("presentation") or payload.get("ir")
        if not isinstance(presentation, dict):
            raise ValueError("Expected JSON field 'presentation' as an object.")
        _validate_presentation(presentation)
        known_asset_ids = payload.get("known_asset_ids") or []
        if not isinstance(known_asset_ids, list) or not all(
            isinstance(value, str) for value in known_asset_ids
        ):
            raise ValueError("known_asset_ids must be an array of strings.")
        normalize_text_layout = payload.get("normalize_text_layout", False)
        if not isinstance(normalize_text_layout, bool):
            raise ValueError("normalize_text_layout must be a boolean.")
        include_canonical_html = payload.get("include_canonical_html", False)
        if not isinstance(include_canonical_html, bool):
            raise ValueError("include_canonical_html must be a boolean.")
        presentation_assets = payload.get("presentation_assets") or {}
        if not isinstance(presentation_assets, dict):
            raise ValueError("presentation_assets must be an object.")
        browser_asset_overrides = payload.get("browser_asset_overrides") or {}
        if not isinstance(browser_asset_overrides, dict):
            raise ValueError("browser_asset_overrides must be an object.")
        browser_asset_suppressions = payload.get("browser_asset_suppressions") or []
        if not isinstance(browser_asset_suppressions, list):
            raise ValueError("browser_asset_suppressions must be an array.")
        result = render_ir_to_slide_document(
            presentation,
            set(known_asset_ids),
            normalize_text_layout=normalize_text_layout,
            include_canonical_html=include_canonical_html,
            asset_payloads=presentation_assets,
            browser_asset_overrides=browser_asset_overrides,
            browser_asset_suppressions=browser_asset_suppressions,
        )
    except ValueError as error:
        self._send_json({"success": False, "error": str(error)}, HTTPStatus.BAD_REQUEST)
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_json(result)

_handle_render_slide_document.__module__ = 'htmlir_server'
_handle_render_slide_document.__qualname__ = 'HtmlIrRequestHandler._handle_render_slide_document'
