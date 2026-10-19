# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_ir_canonical_html
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.validation._validate_presentation import _validate_presentation
from doe_export.service.shared import render_ir_to_canonical

def _handle_ir_canonical_html(self) -> None:
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
        result = render_ir_to_canonical(
            presentation,
            set(known_asset_ids),
            normalize_text_layout=normalize_text_layout,
        )
    except ValueError as error:
        self._send_json({"success": False, "error": str(error)}, HTTPStatus.BAD_REQUEST)
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_json(result)

_handle_ir_canonical_html.__module__ = 'htmlir_server'
_handle_ir_canonical_html.__qualname__ = 'HtmlIrRequestHandler._handle_ir_canonical_html'
