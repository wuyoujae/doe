# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_ir_export_pptx
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.validation._export_embed_fonts import _export_embed_fonts
from doe_export.service.validation._optional_base64_bytes import _optional_base64_bytes
from doe_export.service.validation._validate_presentation import _validate_presentation
from doe_export.service.shared import export_ir_to_pptx

def _handle_ir_export_pptx(self) -> None:
    try:
        payload = self._read_json()
        presentation = payload.get("presentation") or payload.get("ir")
        if not isinstance(presentation, dict):
            raise ValueError("Expected JSON field 'presentation' as an object.")
        if "output_path" in payload:
            raise ValueError("output_path is not accepted by the HTTP API.")
        _validate_presentation(presentation)
        pptx_bytes = export_ir_to_pptx(
            presentation,
            source_pptx=_optional_base64_bytes(payload.get("source_pptx_base64")),
            original_ir=payload.get("original_ir") if isinstance(payload.get("original_ir"), dict) else None,
            export_watermark=payload.get("watermark") is True,
            embed_fonts=_export_embed_fonts(payload),
        )
    except ValueError as error:
        self._send_json({"success": False, "error": str(error)}, HTTPStatus.BAD_REQUEST)
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_pptx(pptx_bytes, "presentation.pptx")

_handle_ir_export_pptx.__module__ = 'htmlir_server'
_handle_ir_export_pptx.__qualname__ = 'HtmlIrRequestHandler._handle_ir_export_pptx'
