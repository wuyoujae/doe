# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_pptx_import
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import import_pptx_to_canonical

def _handle_pptx_import(self) -> None:
    try:
        result = import_pptx_to_canonical(self._read_body())
    except ValueError as error:
        self._send_json({"success": False, "error": str(error)}, HTTPStatus.BAD_REQUEST)
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_json(result)

_handle_pptx_import.__module__ = 'htmlir_server'
_handle_pptx_import.__qualname__ = 'HtmlIrRequestHandler._handle_pptx_import'
