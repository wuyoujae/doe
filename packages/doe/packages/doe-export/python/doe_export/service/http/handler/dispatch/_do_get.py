# Origin: htmlir_server.py::HtmlIrRequestHandler._do_get
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import urlparse

def _do_get(self) -> None:
    route = urlparse(self.path).path
    if route == "/api/status":
        self._send_json(
            {
                "success": True,
                "service": "yrkie-htmlir-runtime",
                "endpoints": [
                    "/api/status",
                    "/api/html/compile",
                    "/api/pptx/import",
                    "/api/ir/canonical-html",
                    "/api/ir/export-html",
                    "/api/v2/slides/extract-editable",
                    "/api/v2/slides/compile",
                    "/api/v2/slides/render",
                    "/api/v2/fonts/subset",
                    "/api/v1/slides/compile-batch",
                    "/api/ir/export-pptx",
                    "/api/ir/export-pdf",
                    "/api/ir/export-png-zip",
                    "/api/html/export-pptx",
                    "/api/schema-v4/export-pptx",
                    "/api/schema-v4/export-pdf",
                    "/api/schema-v4/render-thumbnail",
                    "/api/schema-v4/inspect-slide",
                    "/api/schema-v4/validate-repair",
                ],
            }
        )
        return
    self._send_json({"success": False, "error": "Not found"}, HTTPStatus.NOT_FOUND)

_do_get.__module__ = 'htmlir_server'
_do_get.__qualname__ = 'HtmlIrRequestHandler._do_get'
