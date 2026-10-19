# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_slide_compile_batch
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import HtmlCompileError
from doe_export.service.shared import MAX_BATCH_CONCURRENCY
from doe_export.service.shared import MAX_BATCH_ITEMS
from doe_export.service.shared import MAX_BROWSER_TIMEOUT_MS
from doe_export.service.shared import MAX_DOM_NODES
from doe_export.service.validation._bounded_int import _bounded_int
from doe_export.service.thumbnail._thumbnail_webp_and_palette import _thumbnail_webp_and_palette
from doe_export.service.validation._viewport_from_payload import _viewport_from_payload
from doe_export.service.shared import parse_slide_fragments_to_ir
from doe_export.service.shared import render_ir_preview_png

def _handle_slide_compile_batch(self) -> None:
    try:
        payload = self._read_json()
        items = payload.get("items")
        if not isinstance(items, list) or not items:
            raise ValueError("Expected non-empty JSON field 'items'.")
        if len(items) > MAX_BATCH_ITEMS:
            raise ValueError(f"A slide compile batch cannot exceed {MAX_BATCH_ITEMS} items.")
        self._reject_base_url(payload)
        results = parse_slide_fragments_to_ir(
            items,
            include_ast=bool(payload.get("include_ast", False)),
            include_browser_screenshot=False,
            base_url=None,
            viewport=_viewport_from_payload(payload) if payload.get("viewport") else (1920, 1080),
            timeout_ms=_bounded_int(
                payload, "timeout_ms", 20_000, 1_000, MAX_BROWSER_TIMEOUT_MS
            ),
            max_dom_nodes=_bounded_int(
                payload, "max_dom_nodes", MAX_DOM_NODES, 1, MAX_DOM_NODES
            ),
            render_mode=str(payload.get("render_mode") or "semantic"),
            concurrency=_bounded_int(
                payload, "concurrency", 2, 1, MAX_BATCH_CONCURRENCY
            ),
        )
        for result in results:
            result.pop("browser_screenshot_png_base64", None)
            presentation = result.get("presentation")
            if result.get("success") and isinstance(presentation, dict):
                preview_png = render_ir_preview_png(presentation)
                thumbnail, palette = _thumbnail_webp_and_palette(preview_png)
                result["thumbnail_webp_base64"] = thumbnail
                result["preview_palette"] = palette
    except HtmlCompileError as error:
        response = error.to_response()
        response["error_kind"] = "runtime"
        self._send_json(response, HTTPStatus.SERVICE_UNAVAILABLE)
        return
    except ValueError as error:
        self._send_json({"success": False, "error": str(error)}, HTTPStatus.BAD_REQUEST)
        return
    except Exception as error:
        self._send_internal_error(error)
        return
    self._send_json({"success": True, "results": results})

_handle_slide_compile_batch.__module__ = 'htmlir_server'
_handle_slide_compile_batch.__qualname__ = 'HtmlIrRequestHandler._handle_slide_compile_batch'
