from __future__ import annotations

import http.client
import json
import sys
import threading
import unittest
from pathlib import Path
from modular_patch import patch


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from htmlir_server import (  # noqa: E402
    MAX_COPYIST_EXPORT_BODY_BYTES,
    MAX_COPYIST_V2_BODY_BYTES,
    MAX_JSON_BODY_BYTES,
    HtmlIrRequestHandler,
    HtmlIrHttpServer,
    _allowed_hosts,
    _runtime_token_from_environment,
)
from pptx2html.htmlir import HtmlCompileError  # noqa: E402
from pptx2html.htmlir.compiler import HtmlDiagnostic  # noqa: E402


class HtmlIrServerSecurityTests(unittest.TestCase):
    TOKEN = "htmlir-test-token-0123456789abcdef"

    def test_pptx_routes_validate_and_forward_font_option_with_old_default(self):
        for route, writer, field in (
            ("/api/ir/export-pptx", "export_ir_to_pptx", "presentation"),
            ("/api/schema-v4/export-pptx", "export_schema_v4_deck_to_pptx", "deck"),
        ):
            for option in ({}, {"embed_fonts": True}, {"embed_fonts": False}, {"embed_fonts": "false"}, {"embed_fonts": None}):
                with (
                    self.subTest(route=route, option=option),
                    patch(f"htmlir_server.{writer}", return_value=b"pptx") as export,
                    patch("htmlir_server._validate_presentation"),
                ):
                    status, _, _ = self.request("POST", route, body=json.dumps({field: {"slides": []}, **option}).encode(), headers={"Content-Type": "application/json"})
                    if "embed_fonts" in option and not isinstance(option["embed_fonts"], bool):
                        self.assertEqual(status, 400)
                        export.assert_not_called()
                    else:
                        self.assertEqual(status, 200)
                        self.assertEqual(export.call_args.kwargs["embed_fonts"], option.get("embed_fonts", True))

    def setUp(self) -> None:
        self.server = HtmlIrHttpServer(
            ("127.0.0.1", 0),
            runtime_token=self.TOKEN,
            allowed_hosts=_allowed_hosts("127.0.0.1", []),
            max_concurrency=1,
        )
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_address[1]

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def request(
        self,
        method: str,
        path: str,
        *,
        body: bytes | None = None,
        token: str | None = TOKEN,
        headers: dict[str, str] | None = None,
    ) -> tuple[int, dict[str, str], bytes]:
        request_headers = dict(headers or {})
        if token is not None:
            request_headers["Authorization"] = f"Bearer {token}"
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=2)
        connection.request(method, path, body=body, headers=request_headers)
        response = connection.getresponse()
        response_body = response.read()
        response_headers = {name.lower(): value for name, value in response.getheaders()}
        connection.close()
        return response.status, response_headers, response_body

    def request_with_declared_length(self, path: str, length: int) -> int:
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=2)
        connection.putrequest("POST", path)
        connection.putheader("Authorization", f"Bearer {self.TOKEN}")
        connection.putheader("Content-Type", "application/json")
        connection.putheader("Content-Length", str(length))
        # A client that waits for an early size rejection must advertise that
        # it has not started streaming the declared body. Without Expect,
        # Windows may surface the server's valid early close as WSAECONNABORTED.
        connection.putheader("Expect", "100-continue")
        connection.endheaders()
        response = connection.getresponse()
        response.read()
        connection.close()
        return response.status

    def test_every_route_requires_bearer_token(self) -> None:
        status, headers, body = self.request("GET", "/api/status", token=None)

        self.assertEqual(status, 401)
        self.assertEqual(headers.get("www-authenticate"), "Bearer")
        self.assertFalse(json.loads(body)["success"])

        for method in ("HEAD", "PUT", "PATCH", "DELETE", "TRACE"):
            with self.subTest(method=method):
                status, headers, _ = self.request(method, "/api/status", token=None)
                self.assertEqual(status, 401)
                self.assertEqual(headers.get("www-authenticate"), "Bearer")

    def test_status_has_no_cors_and_rejects_browser_origin(self) -> None:
        status, headers, _ = self.request("GET", "/api/status")
        self.assertEqual(status, 200)
        self.assertNotIn("access-control-allow-origin", headers)
        self.assertEqual(headers.get("cache-control"), "no-store")

        status, _, _ = self.request(
            "GET",
            "/api/status",
            headers={"Origin": "https://attacker.example"},
        )
        self.assertEqual(status, 403)

    def test_authenticated_unsupported_method_returns_405(self) -> None:
        status, headers, _ = self.request("DELETE", "/api/status")

        self.assertEqual(status, 405)
        self.assertEqual(headers.get("allow"), "GET, POST")

    def test_bad_host_is_rejected(self) -> None:
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=2)
        connection.putrequest("GET", "/api/status", skip_host=True)
        connection.putheader("Host", "attacker.example")
        connection.putheader("Authorization", f"Bearer {self.TOKEN}")
        connection.endheaders()
        response = connection.getresponse()
        response.read()
        connection.close()

        self.assertEqual(response.status, 400)

    def test_json_route_rejects_wrong_content_type_and_oversized_body(self) -> None:
        status, _, _ = self.request(
            "POST",
            "/api/html/compile",
            body=b"{}",
            headers={"Content-Type": "text/plain"},
        )
        self.assertEqual(status, 415)

        self.assertEqual(
            self.request_with_declared_length(
                "/api/html/compile", MAX_JSON_BODY_BYTES + 1
            ),
            413,
        )

    def test_general_json_body_limit_is_48_mib_and_inclusive(self) -> None:
        self.assertEqual(MAX_JSON_BODY_BYTES, 48 * 1024 * 1024)

        def respond_without_reading_body(
            handler: HtmlIrRequestHandler, route: str
        ) -> None:
            handler._send_json({"success": True, "route": route})

        with patch.object(
            HtmlIrRequestHandler,
            "_do_post",
            autospec=True,
            side_effect=respond_without_reading_body,
        ):
            status = self.request_with_declared_length(
                "/api/v1/slides/compile-batch", MAX_JSON_BODY_BYTES
            )

        self.assertEqual(status, 200)
        self.assertEqual(
            self.request_with_declared_length(
                "/api/v1/slides/compile-batch", MAX_JSON_BODY_BYTES + 1
            ),
            413,
        )

    def test_copyist_export_body_limit_remains_150_mib_and_inclusive(self) -> None:
        self.assertEqual(MAX_COPYIST_EXPORT_BODY_BYTES, 150 * 1024 * 1024)

        def respond_without_reading_body(
            handler: HtmlIrRequestHandler, route: str
        ) -> None:
            handler._send_json({"success": True, "route": route})

        with patch.object(
            HtmlIrRequestHandler,
            "_do_post",
            autospec=True,
            side_effect=respond_without_reading_body,
        ):
            status = self.request_with_declared_length(
                "/api/ir/export-pptx", MAX_COPYIST_EXPORT_BODY_BYTES
            )

        self.assertEqual(status, 200)
        self.assertEqual(
            self.request_with_declared_length(
                "/api/ir/export-pptx", MAX_COPYIST_EXPORT_BODY_BYTES + 1
            ),
            413,
        )
        self.assertEqual(
            self.request_with_declared_length(
                "/api/ir/export-html", MAX_COPYIST_EXPORT_BODY_BYTES + 1
            ),
            413,
        )
        for route in (
            "/api/ir/export-pdf",
            "/api/ir/export-png-zip",
            "/api/schema-v4/export-pptx",
            "/api/schema-v4/render-thumbnail",
        ):
            with self.subTest(route=route, boundary="inclusive"):
                with patch.object(
                    HtmlIrRequestHandler,
                    "_do_post",
                    autospec=True,
                    side_effect=respond_without_reading_body,
                ):
                    status = self.request_with_declared_length(
                        route, MAX_COPYIST_EXPORT_BODY_BYTES
                    )
                self.assertEqual(status, 200)
            with self.subTest(route=route, boundary="over"):
                self.assertEqual(
                    self.request_with_declared_length(
                        route, MAX_COPYIST_EXPORT_BODY_BYTES + 1
                    ),
                    413,
                )

    def test_only_copyist_v2_compile_and_render_receive_150_mib_budget(self) -> None:
        self.assertEqual(MAX_COPYIST_V2_BODY_BYTES, 150 * 1024 * 1024)

        def respond_without_reading_body(
            handler: HtmlIrRequestHandler, route: str
        ) -> None:
            handler._send_json({"success": True, "route": route})

        with patch.object(
            HtmlIrRequestHandler,
            "_do_post",
            autospec=True,
            side_effect=respond_without_reading_body,
        ):
            for route in ("/api/v2/slides/compile", "/api/v2/slides/render"):
                with self.subTest(route=route):
                    self.assertEqual(
                        self.request_with_declared_length(
                            route, MAX_COPYIST_V2_BODY_BYTES
                        ),
                        200,
                    )
                    self.assertEqual(
                        self.request_with_declared_length(
                            route, MAX_COPYIST_V2_BODY_BYTES + 1
                        ),
                        413,
                    )

        self.assertEqual(
            self.request_with_declared_length(
                "/api/v2/slides/extract-editable", MAX_JSON_BODY_BYTES + 1
            ),
            413,
        )

    def test_http_export_rejects_output_path(self) -> None:
        body = json.dumps(
            {
                "presentation": {"slides": []},
                "output_path": "C:/Windows/Temp/overwrite.pptx",
            }
        ).encode("utf-8")
        status, _, response_body = self.request(
            "POST",
            "/api/ir/export-pptx",
            body=body,
            headers={"Content-Type": "application/json"},
        )

        self.assertEqual(status, 400)
        self.assertIn("output_path", json.loads(response_body)["error"])

    def test_slide_repair_validation_is_authenticated_and_returns_only_report_json(self) -> None:
        report = {
            "success": True,
            "contract": "yrkie-slide-repair-render-gate-v1",
            "pages": [{"page_index": 0, "accepted": True}],
        }
        body = json.dumps(
            {
                "deck": {
                    "version": 4,
                    "deck": {"slides": [{"id": "slide-1"}]},
                }
            }
        ).encode("utf-8")
        with patch(
            "htmlir_server.validate_slide_repair_deck", return_value=report
        ) as validate:
            status, headers, response_body = self.request(
                "POST",
                "/api/schema-v4/validate-repair",
                body=body,
                headers={"Content-Type": "application/json"},
            )

        self.assertEqual(status, 200)
        self.assertEqual(headers.get("content-type"), "application/json; charset=utf-8")
        self.assertEqual(json.loads(response_body), report)
        validate.assert_called_once()

        status, _, _ = self.request(
            "POST",
            "/api/schema-v4/validate-repair",
            body=body,
            token=None,
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(status, 401)

    def test_concurrency_limit_returns_429(self) -> None:
        self.assertTrue(self.server.request_semaphore.acquire(blocking=False))
        try:
            status, headers, _ = self.request("GET", "/api/status")
        finally:
            self.server.request_semaphore.release()

        self.assertEqual(status, 429)
        self.assertEqual(headers.get("retry-after"), "1")

    def test_connection_limit_prevents_unbounded_handler_threads(self) -> None:
        self.assertTrue(self.server.connection_semaphore.acquire(blocking=False))
        try:
            status, headers, _ = self.request("GET", "/api/status")
        finally:
            self.server.connection_semaphore.release()

        self.assertEqual(status, 429)
        self.assertEqual(headers.get("retry-after"), "1")

    def test_client_cannot_raise_browser_timeout_budget(self) -> None:
        body = json.dumps({"html": "<p>safe</p>", "timeout_ms": 30_001}).encode("utf-8")
        status, _, response_body = self.request(
            "POST",
            "/api/html/compile",
            body=body,
            headers={"Content-Type": "application/json"},
        )

        self.assertEqual(status, 400)
        self.assertIn("timeout_ms", json.loads(response_body)["error"])

    def test_compile_batch_marks_worker_failures_as_transient(self) -> None:
        body = json.dumps(
            {"items": [{"id": "slide-1", "fragment": "<div>safe</div>"}]}
        ).encode("utf-8")
        failure = HtmlCompileError(
            "html browser snapshot timed out",
            [HtmlDiagnostic("error", "snapshot-timeout", "Chromium timed out.")],
        )

        with patch("htmlir_server.parse_slide_fragments_to_ir", side_effect=failure):
            status, _, response_body = self.request(
                "POST",
                "/api/v1/slides/compile-batch",
                body=body,
                headers={"Content-Type": "application/json"},
            )

        payload = json.loads(response_body)
        self.assertEqual(status, 503)
        self.assertEqual(payload["error_kind"], "runtime")

    def test_compile_batch_derives_thumbnail_from_authoritative_ir(self) -> None:
        body = json.dumps(
            {
                "items": [{"id": "card-1", "fragment": "<div>safe</div>"}],
                "viewport": {"width": 1080, "height": 1440},
            }
        ).encode("utf-8")
        presentation = {
            "width": 540,
            "height": 720,
            "slides": [{"index": 0, "shapes": []}],
        }
        compiled = [
            {
                "id": "card-1",
                "success": True,
                "presentation": presentation,
                "browser_screenshot_png_base64": "legacy-html-shell-screenshot",
            }
        ]

        with (
            patch("htmlir_server.parse_slide_fragments_to_ir", return_value=compiled) as compile_mock,
            patch("htmlir_server.render_ir_preview_png", return_value=b"ir-preview") as render_mock,
            patch(
                "htmlir_server._thumbnail_webp_and_palette",
                return_value=("portrait-webp", {"version": "preview-palette-v1"}),
            ) as thumbnail_mock,
        ):
            status, _, response_body = self.request(
                "POST",
                "/api/v1/slides/compile-batch",
                body=body,
                headers={"Content-Type": "application/json"},
            )

        payload = json.loads(response_body)
        self.assertEqual(status, 200)
        self.assertEqual(payload["results"][0]["thumbnail_webp_base64"], "portrait-webp")
        self.assertNotIn("browser_screenshot_png_base64", payload["results"][0])
        self.assertFalse(compile_mock.call_args.kwargs["include_browser_screenshot"])
        render_mock.assert_called_once_with(presentation)
        thumbnail_mock.assert_called_once_with(b"ir-preview")

    def test_compile_batch_keeps_invalid_fragments_permanent(self) -> None:
        body = json.dumps(
            {"items": [{"id": "slide-1", "fragment": "<span>invalid root</span>"}]}
        ).encode("utf-8")

        status, _, response_body = self.request(
            "POST",
            "/api/v1/slides/compile-batch",
            body=body,
            headers={"Content-Type": "application/json"},
        )

        payload = json.loads(response_body)
        self.assertEqual(status, 200)
        self.assertFalse(payload["results"][0]["success"])
        self.assertEqual(payload["results"][0]["error_kind"], "content")

    def test_external_runtime_token_must_be_at_least_32_bytes(self) -> None:
        with patch.dict("os.environ", {"YRKIE_HTMLIR_RUNTIME_TOKEN": "too-short"}, clear=False):
            with self.assertRaisesRegex(ValueError, "at least 32 bytes"):
                _runtime_token_from_environment()


if __name__ == "__main__":
    unittest.main()
