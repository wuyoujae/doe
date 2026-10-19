# Origin: htmlir_server.py::HtmlIrRequestHandler._do_post
from __future__ import annotations
from doe_export.service.shared import HTTPStatus

def _do_post(self, route: str) -> None:
    if route == "/api/html/compile":
        self._handle_html_compile()
        return
    if route == "/api/pptx/import":
        self._handle_pptx_import()
        return
    if route == "/api/ir/canonical-html":
        self._handle_ir_canonical_html()
        return
    if route == "/api/ir/export-html":
        self._handle_ir_export_html()
        return
    if route == "/api/v2/slides/extract-editable":
        self._handle_extract_editable_slide()
        return
    if route == "/api/v2/slides/compile":
        self._handle_compile_slide_document()
        return
    if route == "/api/v2/slides/render":
        self._handle_render_slide_document()
        return
    if route == "/api/v2/fonts/subset":
        self._handle_browser_font_subset()
        return
    if route == "/api/v1/slides/compile-batch":
        self._handle_slide_compile_batch()
        return
    if route == "/api/ir/export-pptx":
        self._handle_ir_export_pptx()
        return
    if route == "/api/ir/export-pdf":
        self._handle_ir_export_pdf()
        return
    if route == "/api/ir/export-png-zip":
        self._handle_ir_export_png_zip()
        return
    if route == "/api/html/export-pptx":
        self._handle_html_export_pptx()
        return
    if route == "/api/schema-v4/export-pptx":
        self._handle_schema_v4_export_pptx()
        return
    if route == "/api/schema-v4/export-pdf":
        self._handle_schema_v4_export_pdf()
        return
    if route == "/api/schema-v4/render-thumbnail":
        self._handle_schema_v4_render_thumbnail()
        return
    if route == "/api/schema-v4/inspect-slide":
        self._handle_schema_v4_inspect_slide()
        return
    if route == "/api/schema-v4/validate-repair":
        self._handle_schema_v4_validate_repair()
        return
    self._send_json({"success": False, "error": "Not found"}, HTTPStatus.NOT_FOUND)

_do_post.__module__ = 'htmlir_server'
_do_post.__qualname__ = 'HtmlIrRequestHandler._do_post'
