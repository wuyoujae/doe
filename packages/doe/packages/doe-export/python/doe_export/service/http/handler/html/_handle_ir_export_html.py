# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_ir_export_html
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import MAX_HTML_EXPORT_BYTES
from doe_export.service.validation._validate_presentation import _validate_presentation
from doe_export.service.shared import export_ir_to_html

def _handle_ir_export_html(self) -> None:
    try:
        payload = self._read_json()
        presentation = payload.get("presentation") or payload.get("ir")
        if not isinstance(presentation, dict):
            raise ValueError("Expected JSON field 'presentation' as an object.")
        if "output_path" in payload:
            raise ValueError("output_path is not accepted by the HTTP API.")
        _validate_presentation(presentation)
        html_bytes = export_ir_to_html(
            presentation,
            export_watermark=payload.get("watermark") is True,
            max_output_bytes=MAX_HTML_EXPORT_BYTES,
        )
    except ValueError as error:
        self._send_json({"success": False, "error": str(error)}, HTTPStatus.BAD_REQUEST)
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_file(
        html_bytes,
        "text/html; charset=utf-8",
        "presentation.html",
    )

_handle_ir_export_html.__module__ = 'htmlir_server'
_handle_ir_export_html.__qualname__ = 'HtmlIrRequestHandler._handle_ir_export_html'
