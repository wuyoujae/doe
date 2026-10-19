from __future__ import annotations

import base64
import dataclasses
import http.client
import json
import sys
import threading
import unittest
from pathlib import Path


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from htmlir_server import HtmlIrHttpServer, _allowed_hosts  # noqa: E402
from pptx_pipeline import (  # noqa: E402
    export_ir_to_html,
    extract_editable_slide_html,
)
from pptx2html.htmlir import (  # noqa: E402
    compile_html,
    reconcile_editable_html_with_current_ir,
)
from pptx2html.ir.model import (  # noqa: E402
    Background,
    Bounds,
    Fill,
    Font,
    ImageInfo,
    Paragraph,
    Presentation,
    Run,
    Shape,
    Slide,
    TextFrame,
)


def _two_slide_presentation() -> Presentation:
    image = base64.b64encode(
        b"\x89PNG\r\n\x1a\nself-contained-export-image"
    ).decode("ascii")
    return Presentation(
        width=960,
        height=540,
        slides=[
            Slide(
                index=0,
                name="First",
                background=Background(fill=Fill(type="solid", color="F4F1E8")),
                shapes=[
                    Shape(
                        type="picture",
                        name="Inline image",
                        shape_id=10,
                        bounds=Bounds(20, 30, 200, 120),
                        image=ImageInfo(content_type="image/png", data=image),
                    )
                ],
            ),
            Slide(
                index=1,
                name="Second",
                background=Background(fill=Fill(type="solid", color="102030")),
            ),
        ],
    )


def _editable_text_presentation() -> Presentation:
    return Presentation(
        width=960,
        height=540,
        slides=[
            Slide(
                index=0,
                name="Editable",
                shapes=[
                    Shape(
                        type="auto_shape",
                        name="Title",
                        shape_id=42,
                        source_scope="slide",
                        bounds=Bounds(80, 70, 360, 72),
                        text=TextFrame(
                            paragraphs=[
                                Paragraph(
                                    runs=[
                                        Run(
                                            text="Original title",
                                            font=Font(
                                                family="Arial",
                                                size_pt=28,
                                                color="112233",
                                            ),
                                        )
                                    ]
                                )
                            ]
                        ),
                    )
                ],
            )
        ],
    )


class CanonicalHtmlExportTests(unittest.TestCase):
    def test_multi_slide_export_is_self_contained_and_round_trips_exactly(self) -> None:
        presentation = _two_slide_presentation()

        exported = export_ir_to_html(dataclasses.asdict(presentation))
        html = exported.decode("utf-8")

        self.assertTrue(html.startswith("<!DOCTYPE html>"))
        self.assertIn('data-slide-count="2"', html)
        self.assertEqual(html.count("PPTX2HTML_SLIDE_START:"), 2)
        self.assertIn('id="pptx2html-canonical-ir"', html)
        self.assertIn("data:image/png;base64,", html)
        self.assertNotIn("yrkie-asset-data://", html)
        self.assertNotIn("yrkie-asset-base64://", html)

        compiled = compile_html(html, include_ast=True)
        self.assertEqual(compiled["presentation"], dataclasses.asdict(presentation))
        self.assertEqual(compiled["ast"]["kind"], "htmlir-canonical-lossless")
        self.assertEqual(
            compiled["diagnostics"][0]["code"],
            "canonical-html-lossless",
        )

    def test_dom_addition_from_export_uses_semantic_fallback(self) -> None:
        presentation = _editable_text_presentation()
        html = export_ir_to_html(dataclasses.asdict(presentation)).decode("utf-8")
        extracted = extract_editable_slide_html(html)
        editable = extracted["editable_html"]
        insertion = (
            '<div data-yrkie-element-id="new-callout" '
            'element-name="New callout" element-type="text" '
            'style="position:absolute;left:120pt;top:220pt;width:260pt;'
            'height:60pt;background:#ffeeaa;color:#112233;font-size:24pt">'
            "New callout</div>"
        )
        layer_end = editable.rfind("</div>")
        edited = editable[:layer_end] + insertion + editable[layer_end:]

        reconciled = reconcile_editable_html_with_current_ir(
            edited,
            extracted["current_ir"],
        )

        self.assertTrue(reconciled["success"], reconciled.get("diagnostics"))
        self.assertEqual(reconciled["reconcile_mode"], "semantic-fallback")
        self.assertIn(
            "slide-structure-semantic-fallback-preserved",
            {item["code"] for item in reconciled["diagnostics"]},
        )

    def test_watermark_is_export_only_visible_and_self_contained(self) -> None:
        presentation = dataclasses.asdict(_two_slide_presentation())

        paid = export_ir_to_html(presentation, export_watermark=False).decode("utf-8")
        prelude = export_ir_to_html(presentation, export_watermark=True).decode("utf-8")

        self.assertNotIn("yrkie-export-watermark-style", paid)
        self.assertIn('id="yrkie-export-watermark-style"', prelude)
        self.assertIn(".pptx-slide.pptx-canonical-slide::after", prelude)
        self.assertIn("data:image/png;base64,", prelude)
        self.assertIn('id="pptx2html-canonical-ir"', prelude)
        self.assertEqual(compile_html(prelude)["presentation"], presentation)

    def test_external_media_resources_fail_but_text_hyperlinks_remain_allowed(self) -> None:
        for resource_url in (
            "https://cdn.example.invalid/image.png",
            "http://cdn.example.invalid/image.png",
            "file:///tmp/image.png",
            "blob:https://example.invalid/asset",
        ):
            with self.subTest(resource_url=resource_url):
                presentation = dataclasses.asdict(_two_slide_presentation())
                image = presentation["slides"][0]["shapes"][0]["image"]
                image["data"] = ""
                image["url"] = resource_url

                with self.assertRaisesRegex(
                    ValueError,
                    "cannot depend on external resources",
                ):
                    export_ir_to_html(presentation)

        linked = _editable_text_presentation()
        linked.slides[0].shapes[0].text.paragraphs[0].runs[
            0
        ].font.hyperlink_url = "https://yrkie.com/"
        html = export_ir_to_html(dataclasses.asdict(linked)).decode("utf-8")
        self.assertIn('href="https://yrkie.com/"', html)

    def test_external_resource_inside_embedded_svg_is_rejected(self) -> None:
        presentation = dataclasses.asdict(_two_slide_presentation())
        image = presentation["slides"][0]["shapes"][0]["image"]
        svg = (
            '<svg xmlns="http://www.w3.org/2000/svg">'
            '<image href="https://cdn.example.invalid/image.png"/>'
            "</svg>"
        )
        image["content_type"] = "image/svg+xml"
        image["data"] = base64.b64encode(svg.encode("utf-8")).decode("ascii")

        with self.assertRaisesRegex(ValueError, "external SVG resource"):
            export_ir_to_html(presentation)


class CanonicalHtmlExportHttpTests(unittest.TestCase):
    TOKEN = "canonical-html-export-test-token-012345"

    def setUp(self) -> None:
        self.server = HtmlIrHttpServer(
            ("127.0.0.1", 0),
            runtime_token=self.TOKEN,
            allowed_hosts=_allowed_hosts("127.0.0.1", []),
            max_concurrency=1,
        )
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def test_export_endpoint_returns_attachment_html(self) -> None:
        body = json.dumps(
            {
                "presentation": dataclasses.asdict(_two_slide_presentation()),
                "watermark": True,
            }
        ).encode("utf-8")
        connection = http.client.HTTPConnection(
            "127.0.0.1",
            self.server.server_address[1],
            timeout=10,
        )
        connection.request(
            "POST",
            "/api/ir/export-html",
            body=body,
            headers={
                "Authorization": f"Bearer {self.TOKEN}",
                "Content-Type": "application/json",
            },
        )
        response = connection.getresponse()
        payload = response.read()
        headers = {name.lower(): value for name, value in response.getheaders()}
        status = response.status
        connection.close()

        self.assertEqual(status, 200)
        self.assertEqual(headers["content-type"], "text/html; charset=utf-8")
        self.assertEqual(headers["cache-control"], "no-store")
        self.assertEqual(
            headers["content-disposition"],
            'attachment; filename="presentation.html"',
        )
        self.assertTrue(payload.startswith(b"<!DOCTYPE html>"))
        self.assertIn(b"yrkie-export-watermark-style", payload)


if __name__ == "__main__":
    unittest.main()
