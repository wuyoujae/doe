# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_html_export_pptx
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import HtmlCompileError
from doe_export.service.shared import MAX_BROWSER_TIMEOUT_MS
from doe_export.service.shared import MAX_DOM_NODES
from doe_export.service.validation._bounded_int import _bounded_int
from doe_export.service.validation._viewport_from_payload import _viewport_from_payload
from doe_export.service.shared import html_to_pptx

def _handle_html_export_pptx(self) -> None:
    try:
        payload = self._read_json()
        html = payload.get("html") or payload.get("source")
        if not isinstance(html, str):
            raise ValueError("Expected JSON field 'html' as a string.")
        if "output_path" in payload:
            raise ValueError("output_path is not accepted by the HTTP API.")
        self._reject_base_url(payload)
        result = html_to_pptx(
            html,
            slide_index=int(payload.get("slide_index") or 0),
            include_ast=bool(payload.get("include_ast", False)),
            include_browser_screenshot=bool(payload.get("include_browser_screenshot", False)),
            base_url=None,
            viewport=_viewport_from_payload(payload),
            timeout_ms=_bounded_int(
                payload, "timeout_ms", 20_000, 1_000, MAX_BROWSER_TIMEOUT_MS
            ),
            max_dom_nodes=_bounded_int(
                payload, "max_dom_nodes", MAX_DOM_NODES, 1, MAX_DOM_NODES
            ),
            render_mode=str(payload.get("render_mode") or "semantic"),
        )
    except HtmlCompileError as error:
        self._send_json(error.to_response(), HTTPStatus.BAD_REQUEST)
        return
    except ValueError as error:
        self._send_json({"success": False, "error": str(error)}, HTTPStatus.BAD_REQUEST)
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    pptx_bytes = result.pop("pptx_bytes")
    self._send_pptx(pptx_bytes, "html-presentation.pptx")

_handle_html_export_pptx.__module__ = 'htmlir_server'
_handle_html_export_pptx.__qualname__ = 'HtmlIrRequestHandler._handle_html_export_pptx'
