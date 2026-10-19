# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_ir_export_pdf
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.validation._validate_presentation import _validate_presentation
from doe_export.service.shared import export_ir_to_pdf

def _handle_ir_export_pdf(self) -> None:
    try:
        payload = self._read_json()
        presentation = payload.get("presentation") or payload.get("ir")
        if not isinstance(presentation, dict):
            raise ValueError("Expected JSON field 'presentation' as an object.")
        _validate_presentation(presentation)
        pdf_bytes = export_ir_to_pdf(
            presentation,
            export_watermark=payload.get("watermark") is True,
        )
    except ValueError as error:
        self._send_json({"success": False, "error": str(error)}, HTTPStatus.BAD_REQUEST)
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_file(pdf_bytes, "application/pdf", "presentation.pdf")

_handle_ir_export_pdf.__module__ = 'htmlir_server'
_handle_ir_export_pdf.__qualname__ = 'HtmlIrRequestHandler._handle_ir_export_pdf'
