# Origin: htmlir_server.py::HtmlIrRequestHandler._validate_post_body
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import JSON_CONTENT_TYPES
from doe_export.service.shared import MAX_COPYIST_EXPORT_BODY_BYTES
from doe_export.service.shared import MAX_COPYIST_V2_BODY_BYTES
from doe_export.service.shared import MAX_JSON_BODY_BYTES
from doe_export.service.shared import MAX_PPTX_IMPORT_BYTES
from doe_export.service.shared import PPTX_CONTENT_TYPES

def _validate_post_body(self, route: str) -> bool:
    if self.headers.get_all("Transfer-Encoding"):
        self._send_json(
            {"success": False, "error": "Transfer-Encoding is not supported."},
            HTTPStatus.BAD_REQUEST,
        )
        return False
    length_headers = self.headers.get_all("Content-Length") or []
    if len(length_headers) != 1:
        self._send_json(
            {"success": False, "error": "A single Content-Length header is required."},
            HTTPStatus.LENGTH_REQUIRED,
        )
        return False
    try:
        length = int(length_headers[0])
    except ValueError:
        length = -1
    if length <= 0:
        self._send_json(
            {"success": False, "error": "A non-empty request body is required."},
            HTTPStatus.LENGTH_REQUIRED,
        )
        return False
    if route == "/api/pptx/import":
        allowed_content_types = PPTX_CONTENT_TYPES
        max_bytes = MAX_PPTX_IMPORT_BYTES
    else:
        allowed_content_types = JSON_CONTENT_TYPES
        if route in {
            "/api/ir/export-pptx",
            "/api/ir/export-html",
            "/api/ir/export-pdf",
            "/api/ir/export-png-zip",
            "/api/schema-v4/export-pptx",
            "/api/schema-v4/export-pdf",
            "/api/schema-v4/render-thumbnail",
        }:
            max_bytes = MAX_COPYIST_EXPORT_BODY_BYTES
        elif route in {"/api/v2/slides/compile", "/api/v2/slides/render"}:
            max_bytes = MAX_COPYIST_V2_BODY_BYTES
        else:
            max_bytes = MAX_JSON_BODY_BYTES
    content_type = (self.headers.get("Content-Type") or "").partition(";")[0].strip().lower()
    if content_type not in allowed_content_types:
        self._send_json(
            {"success": False, "error": "Unsupported Content-Type."},
            HTTPStatus.UNSUPPORTED_MEDIA_TYPE,
        )
        return False
    if length > max_bytes:
        self._send_json(
            {"success": False, "error": f"Request body cannot exceed {max_bytes} bytes."},
            HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
        )
        return False
    self._request_length = length
    return True

_validate_post_body.__module__ = 'htmlir_server'
_validate_post_body.__qualname__ = 'HtmlIrRequestHandler._validate_post_body'
