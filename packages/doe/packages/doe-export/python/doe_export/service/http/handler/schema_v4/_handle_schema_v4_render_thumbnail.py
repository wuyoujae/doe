# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_schema_v4_render_thumbnail
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import SchemaV4ExportError
from doe_export.service.shared import render_schema_v4_thumbnail

def _handle_schema_v4_render_thumbnail(self) -> None:
    try:
        payload = self._read_json()
        deck = payload.get("deck")
        if not isinstance(deck, dict):
            raise ValueError("Expected JSON field 'deck' as an object.")
        assets = payload.get("assets")
        if assets is not None and not isinstance(assets, dict):
            raise ValueError("Expected JSON field 'assets' as an object.")
        total_slides = payload.get("total_slides")
        if total_slides is not None and not isinstance(total_slides, int):
            raise ValueError("Expected JSON field 'total_slides' as an integer.")
        thumbnail = render_schema_v4_thumbnail(
            deck,
            assets=assets,
            total_slides=total_slides,
        )
    except (SchemaV4ExportError, ValueError) as error:
        self._send_json(
            {"success": False, "error": str(error)},
            HTTPStatus.BAD_REQUEST,
        )
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_file(thumbnail, "image/webp", "schema-v4-thumbnail.webp")

_handle_schema_v4_render_thumbnail.__module__ = 'htmlir_server'
_handle_schema_v4_render_thumbnail.__qualname__ = 'HtmlIrRequestHandler._handle_schema_v4_render_thumbnail'
