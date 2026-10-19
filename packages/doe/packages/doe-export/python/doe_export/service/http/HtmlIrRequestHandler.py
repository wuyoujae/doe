# Origin: htmlir_server.py::HtmlIrRequestHandler
from __future__ import annotations
from doe_export.service.shared import BaseHTTPRequestHandler
from doe_export.service.shared import SOCKET_TIMEOUT_SECONDS

class HtmlIrRequestHandler(BaseHTTPRequestHandler):
    server_version = "YrkieHtmlIrRuntime/0.1"

    def setup(self) -> None:
        super().setup()
        self.connection.settimeout(SOCKET_TIMEOUT_SECONDS)

    from doe_export.service.http.handler.dispatch.do_OPTIONS import do_OPTIONS

    from doe_export.service.http.handler.document._handle_unsupported_method import _handle_unsupported_method

    do_HEAD = _handle_unsupported_method
    do_PUT = _handle_unsupported_method
    do_PATCH = _handle_unsupported_method
    do_DELETE = _handle_unsupported_method
    do_TRACE = _handle_unsupported_method
    do_CONNECT = _handle_unsupported_method

    from doe_export.service.http.handler.dispatch.do_GET import do_GET

    from doe_export.service.http.handler.dispatch._do_get import _do_get

    from doe_export.service.http.handler.dispatch.do_POST import do_POST

    from doe_export.service.http.handler.dispatch._do_post import _do_post

    from doe_export.service.http.handler.validation._validate_request_boundary import _validate_request_boundary

    from doe_export.service.http.handler.validation._validate_post_body import _validate_post_body

    from doe_export.service.http.handler.dispatch._acquire_request_slot import _acquire_request_slot

    from doe_export.service.http.handler.dispatch._release_request_slot import _release_request_slot

    from doe_export.service.http.handler.pptx._handle_pptx_import import _handle_pptx_import

    from doe_export.service.http.handler.html._handle_ir_canonical_html import _handle_ir_canonical_html

    from doe_export.service.http.handler.document._handle_extract_editable_slide import _handle_extract_editable_slide

    from doe_export.service.http.handler.document._handle_render_slide_document import _handle_render_slide_document

    from doe_export.service.http.handler.document._handle_compile_slide_document import _handle_compile_slide_document

    from doe_export.service.http.handler.document._handle_browser_font_subset import _handle_browser_font_subset

    from doe_export.service.http.handler.html._handle_html_compile import _handle_html_compile

    from doe_export.service.http.handler.document._handle_slide_compile_batch import _handle_slide_compile_batch

    from doe_export.service.http.handler.pptx._handle_ir_export_pptx import _handle_ir_export_pptx

    from doe_export.service.http.handler.pdf._handle_ir_export_pdf import _handle_ir_export_pdf
    from doe_export.service.http.handler.pdf._handle_schema_v4_export_pdf import _handle_schema_v4_export_pdf

    from doe_export.service.http.handler.html._handle_ir_export_html import _handle_ir_export_html

    from doe_export.service.http.handler.png._handle_ir_export_png_zip import _handle_ir_export_png_zip

    from doe_export.service.http.handler.pptx._handle_html_export_pptx import _handle_html_export_pptx

    from doe_export.service.http.handler.pptx._handle_schema_v4_export_pptx import _handle_schema_v4_export_pptx

    from doe_export.service.http.handler.schema_v4._handle_schema_v4_render_thumbnail import _handle_schema_v4_render_thumbnail
    from doe_export.service.http.handler.schema_v4._handle_schema_v4_inspect_slide import _handle_schema_v4_inspect_slide

    from doe_export.service.http.handler.schema_v4._handle_schema_v4_validate_repair import _handle_schema_v4_validate_repair

    from doe_export.service.http.handler.validation._reject_base_url import _reject_base_url

    from doe_export.service.http.handler.transport._read_body import _read_body

    from doe_export.service.http.handler.transport._read_json import _read_json

    from doe_export.service.http.handler.transport._send_internal_error import _send_internal_error

    from doe_export.service.http.handler.transport._send_json import _send_json

    from doe_export.service.http.handler.transport._send_pptx import _send_pptx

    from doe_export.service.http.handler.transport._send_file import _send_file

    from doe_export.service.http.handler.transport.log_message import log_message

HtmlIrRequestHandler.__module__ = 'htmlir_server'
