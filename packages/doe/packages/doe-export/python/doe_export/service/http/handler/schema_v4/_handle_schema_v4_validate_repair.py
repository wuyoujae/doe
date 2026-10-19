# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_schema_v4_validate_repair
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import SlideRepairRenderGateError
from doe_export.service.shared import validate_slide_repair_deck

def _handle_schema_v4_validate_repair(self) -> None:
    try:
        payload = self._read_json()
        deck = payload.get("deck")
        if not isinstance(deck, dict):
            raise ValueError("Expected JSON field 'deck' as an object.")
        report = validate_slide_repair_deck(deck)
    except (SlideRepairRenderGateError, ValueError) as error:
        self._send_json(
            {"success": False, "error": str(error)},
            HTTPStatus.BAD_REQUEST,
        )
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_json(report)

_handle_schema_v4_validate_repair.__module__ = 'htmlir_server'
_handle_schema_v4_validate_repair.__qualname__ = 'HtmlIrRequestHandler._handle_schema_v4_validate_repair'
