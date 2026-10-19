# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_schema_v4_export_pptx
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import SchemaV4ExportError
from doe_export.service.validation._export_embed_fonts import _export_embed_fonts
from doe_export.service.shared import export_schema_v4_deck_to_pptx
from doe_export.pptx.schema.layout_error import SchemaLayoutOverflowError

def _handle_schema_v4_export_pptx(self) -> None:
    try:
        payload = self._read_json()
        deck = payload.get("deck")
        if not isinstance(deck, dict):
            raise ValueError("Expected JSON field 'deck' as an object.")
        assets = payload.get("assets")
        if assets is not None and not isinstance(assets, dict):
            raise ValueError("Expected JSON field 'assets' as an object.")
        output_mode = str(payload.get("output_mode") or "editable").strip().lower()
        if output_mode not in {"visual", "editable"}:
            raise ValueError(
                "Expected JSON field 'output_mode' to be 'visual' or 'editable'."
            )
        pptx_bytes = export_schema_v4_deck_to_pptx(
            deck,
            assets=assets,
            export_watermark=payload.get("watermark") is True,
            output_mode=output_mode,
            embed_fonts=_export_embed_fonts(payload),
        )
    except SchemaLayoutOverflowError as error:
        self._send_json({"success": False, "code": error.code, "error": str(error), "page": error.page}, HTTPStatus.BAD_REQUEST)
        return
    except (SchemaV4ExportError, ValueError) as error:
        self._send_json(
            {"success": False, "error": str(error)},
            HTTPStatus.BAD_REQUEST,
        )
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_pptx(pptx_bytes, "schema-v4-presentation.pptx")

_handle_schema_v4_export_pptx.__module__ = 'htmlir_server'
_handle_schema_v4_export_pptx.__qualname__ = 'HtmlIrRequestHandler._handle_schema_v4_export_pptx'
