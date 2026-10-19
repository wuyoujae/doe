from __future__ import annotations

import base64
import copy
import dataclasses
import hashlib
import http.client
import json
import re
import sys
import threading
import unittest
import zipfile
import xml.etree.ElementTree as ET
from io import BytesIO
from pathlib import Path
from modular_patch import patch


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from htmlir_server import HtmlIrHttpServer, _allowed_hosts  # noqa: E402
from pptx_pipeline import (  # noqa: E402
    _refresh_canonical_slide_hashes,
    export_ir_to_pptx,
    render_ir_to_canonical,
)
from pptx2html.htmlir import compiler as compiler_module  # noqa: E402
from pptx2html.ir.model import (  # noqa: E402
    Bounds,
    BulletInfo,
    Fill,
    Font,
    ImageInfo,
    Paragraph,
    Presentation,
    Run,
    Shape,
    Slide,
    TableCell,
    TableInfo,
    TextFrame,
    TextLayoutSnapshot,
)
from pptx2html.ir.text_layout_snapshot import (  # noqa: E402
    create_layout_snapshot,
    make_text_container_metrics,
)
from pptx2html.renderer.canonical_html_renderer import (  # noqa: E402
    CanonicalHtmlRenderer,
)


def text_frame(
    value: str = "A browser-authored editable line",
    *,
    htmlir: bool = True,
    dirty: bool = False,
) -> TextFrame:
    return TextFrame(
        paragraphs=[
            Paragraph(
                runs=[Run(text=value, font=Font(family="Arial", size_pt=18.0))]
            )
        ],
        style_provenance=["htmlir:text-css"] if htmlir else ["pptx:direct"],
        layout_snapshot_dirty=dirty,
    )


def one_text_slide(frame: TextFrame) -> Presentation:
    return Presentation(
        width=960.0,
        height=540.0,
        slides=[
            Slide(
                index=0,
                shapes=[
                    Shape(
                        type="auto_shape",
                        shape_id=7,
                        bounds=Bounds(40.0, 50.0, 320.0, 90.0),
                        text=frame,
                    )
                ],
            )
        ],
    )


def legacy_cover_presentation(*, slide_count: int = 1) -> Presentation:
    number_frame = TextFrame(
        word_wrap=True,
        paragraphs=[
            Paragraph(
                line_spacing_pt=160.0,
                line_spacing_type="points",
                runs=[
                    Run(
                        text="24",
                        font=Font(
                            family="STSong",
                            latin_family="STSong",
                            ea_family="STSong",
                            size_pt=160.0,
                            bold=True,
                            char_spacing_pt=-8.0,
                        ),
                    )
                ],
            )
        ],
        style_provenance=["htmlir:computed-style"],
    )
    title_font = Font(
        family="STSong",
        latin_family="STSong",
        ea_family="STSong",
        size_pt=55.0,
    )
    title_frame = TextFrame(
        word_wrap=True,
        paragraphs=[
            Paragraph(
                line_spacing_pt=66.0,
                line_spacing_type="points",
                runs=[
                    Run(text="韧性生长，", font=title_font),
                    Run(text="", kind="break"),
                    Run(text="奔向未来", font=title_font),
                ],
            )
        ],
        style_provenance=["htmlir:computed-style"],
    )
    slides = []
    for index in range(slide_count):
        slides.append(
            Slide(
                index=index,
                shapes=[
                    Shape(
                        type="auto_shape",
                        name="legacy cover number",
                        shape_id=6,
                        bounds=Bounds(795.914, 30.0, 134.086, 160.0),
                        text=copy.deepcopy(number_frame),
                    ),
                    Shape(
                        type="auto_shape",
                        name="legacy cover title",
                        shape_id=9,
                        bounds=Bounds(56.0, 194.25, 462.0, 132.0),
                        text=copy.deepcopy(title_frame),
                    ),
                ],
            )
        )
    return Presentation(width=960.0, height=540.0, slides=slides)


def successful_normalizer(source: str, presentation: Presentation):
    normalized = copy.deepcopy(presentation)
    frame = normalized.slides[0].shapes[0].text
    assert frame is not None
    frame.layout_snapshot = create_layout_snapshot(
        frame,
        [],
        container_metrics=make_text_container_metrics(320.0, 90.0),
    )
    frame.layout_snapshot_dirty = False
    return normalized, 1


class EditorTextLayoutNormalizationTests(unittest.TestCase):
    @staticmethod
    def _bullet_blank_and_field_presentation() -> Presentation:
        font = Font(family="Arial", size_pt=18.0)
        frame = TextFrame(
            paragraphs=[
                Paragraph(
                    bullet=BulletInfo(kind="char", char="•"),
                    runs=[
                        Run(
                            text="Bullet content that wraps across the narrow text box",
                            font=font,
                        )
                    ],
                ),
                Paragraph(runs=[]),
                Paragraph(
                    bullet=BulletInfo(kind="char", char="•"),
                    runs=[Run(text="", font=font)],
                ),
                Paragraph(
                    runs=[
                        Run(
                            text="Displayed field value that also wraps across the narrow box",
                            font=font,
                            kind="field",
                            field_id="field-7",
                            field_type="slidenum",
                        )
                    ]
                ),
            ],
            style_provenance=["htmlir:text-css"],
        )
        return Presentation(
            width=960.0,
            height=540.0,
            slides=[
                Slide(
                    index=0,
                    shapes=[
                        Shape(
                            type="auto_shape",
                            shape_id=17,
                            bounds=Bounds(20.0, 20.0, 155.0, 220.0),
                            text=frame,
                        )
                    ],
                )
            ],
        )

    def test_canonical_dom_has_stable_shape_and_table_cell_text_keys(self) -> None:
        child = Shape(
            type="auto_shape",
            bounds=Bounds(20.0, 20.0, 200.0, 60.0),
            text=text_frame("Nested text"),
        )
        table = Shape(
            type="graphic_frame",
            bounds=Bounds(260.0, 20.0, 300.0, 80.0),
            table=TableInfo(
                rows=[
                    [
                        TableCell(text_frame=text_frame("Cell text")),
                        TableCell(text="Plain fallback"),
                    ]
                ],
                col_widths=[150.0, 150.0],
                row_heights=[80.0],
            ),
        )
        presentation = Presentation(
            slides=[
                Slide(
                    index=0,
                    shapes=[Shape(type="group_shape", shapes=[child]), table],
                )
            ]
        )

        rendered = CanonicalHtmlRenderer().render(presentation)

        self.assertIn(
            'data-pptx-text-key="slide:0:shape:1:text"',
            rendered,
        )
        self.assertIn(
            'data-pptx-text-key="slide:0:shape:2:cell:0:0"',
            rendered,
        )
        self.assertNotIn("slide:0:shape:2:cell:0:1", rendered)

    def test_native_non_dirty_text_never_launches_chromium_normalization(self) -> None:
        presentation = one_text_slide(text_frame(htmlir=False, dirty=False))

        with patch.object(
            compiler_module,
            "normalize_canonical_text_layout",
            create=True,
        ) as normalize:
            result = render_ir_to_canonical(
                dataclasses.asdict(presentation),
                normalize_text_layout=True,
            )

        normalize.assert_not_called()
        returned = result["presentation"]["slides"][0]["shapes"][0]["text"]
        self.assertIsNone(returned["layout_snapshot"])
        self.assertFalse(returned["layout_snapshot_dirty"])

    def test_rotated_no_wrap_text_normalizes_without_chromium(self) -> None:
        frame = text_frame("RESULTS", htmlir=True, dirty=True)
        frame.word_wrap = False
        presentation = one_text_slide(frame)
        presentation.slides[0].shapes[0].rotation = 12.0

        with patch.object(
            compiler_module,
            "normalize_canonical_text_layout",
            create=True,
        ) as normalize:
            result = render_ir_to_canonical(
                dataclasses.asdict(presentation),
                normalize_text_layout=True,
            )

        normalize.assert_not_called()
        returned = result["presentation"]["slides"][0]["shapes"][0]["text"]
        self.assertEqual(
            returned["layout_snapshot"]["provider"],
            "deterministic-no-wrap",
        )
        self.assertEqual(returned["layout_snapshot"]["soft_breaks"], [])
        self.assertFalse(returned["layout_snapshot_dirty"])
        self.assertTrue(result["text_layout_normalized"])
        self.assertEqual(result["normalized_text_frame_count"], 1)
        self.assertEqual(result["unresolved_text_frame_count"], 0)

    def test_old_htmlir_frame_without_snapshot_is_migrated_through_chromium(self) -> None:
        presentation = one_text_slide(text_frame(htmlir=True, dirty=False))

        with patch.object(
            compiler_module,
            "normalize_canonical_text_layout",
            side_effect=successful_normalizer,
            create=True,
        ) as normalize:
            result = render_ir_to_canonical(
                dataclasses.asdict(presentation),
                normalize_text_layout=True,
            )

        normalize.assert_called_once()
        returned = result["presentation"]["slides"][0]["shapes"][0]["text"]
        self.assertIsNotNone(returned["layout_snapshot"])
        self.assertFalse(returned["layout_snapshot_dirty"])
        self.assertTrue(result["text_layout_normalized"])
        self.assertEqual(result["normalized_text_frame_count"], 1)
        self.assertEqual(result["unresolved_text_frame_count"], 0)

    def test_inert_shape_name_with_svg_data_prefix_does_not_block_layout(self) -> None:
        safe_svg = (
            b'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">'
            b'<rect width="20" height="20" fill="#123456"/></svg>'
        )
        presentation = one_text_slide(text_frame(htmlir=True, dirty=True))
        presentation.slides[0].shapes.append(
            Shape(
                type="auto_shape",
                shape_id=8,
                name="html background bg-[url('data:image/svg+xml;bas",
                bounds=Bounds(400.0, 100.0, 200.0, 200.0),
                fill=Fill(
                    type="picture",
                    image=ImageInfo(
                        content_type="image/svg+xml",
                        data=base64.b64encode(safe_svg).decode("ascii"),
                        tile=True,
                        intrinsic_width_pt=20.0,
                        intrinsic_height_pt=20.0,
                    ),
                ),
            )
        )

        result = render_ir_to_canonical(
            dataclasses.asdict(presentation),
            normalize_text_layout=True,
        )

        self.assertTrue(result["text_layout_normalized"])
        self.assertEqual(result["normalized_text_frame_count"], 1)
        self.assertEqual(result["unresolved_text_frame_count"], 0)

    def test_legacy_canonical_without_text_keys_is_reprojected_before_restore(self) -> None:
        source = CanonicalHtmlRenderer(mode="embedded").render(
            legacy_cover_presentation()
        )
        legacy_source = re.sub(
            r'\sdata-pptx-text-key="[^"]+"',
            "",
            source,
        )
        legacy_source = _refresh_canonical_slide_hashes(legacy_source)

        result = compiler_module.compile_html(
            legacy_source,
            include_ast=False,
            include_browser_screenshot=False,
        )

        frames = [
            shape["text"]
            for shape in result["presentation"]["slides"][0]["shapes"]
        ]
        self.assertTrue(all(frame["layout_snapshot"] for frame in frames))
        self.assertTrue(all(not frame["layout_snapshot_dirty"] for frame in frames))
        self.assertIn(
            "canonical-text-layout-migrated",
            {item["code"] for item in result["diagnostics"]},
        )

    def test_pptx_export_normalizes_every_legacy_htmlir_slide(self) -> None:
        presentation = dataclasses.asdict(legacy_cover_presentation(slide_count=2))
        original = copy.deepcopy(presentation)

        pptx_bytes = export_ir_to_pptx(presentation)

        self.assertEqual(presentation, original)
        with zipfile.ZipFile(BytesIO(pptx_bytes)) as package:
            for slide_number in (1, 2):
                root = ET.fromstring(
                    package.read(f"ppt/slides/slide{slide_number}.xml")
                )
                shapes = root.findall(
                    ".//{http://schemas.openxmlformats.org/presentationml/2006/main}sp"
                )
                number_shape = next(
                    shape
                    for shape in shapes
                    if "".join(
                        node.text or ""
                        for node in shape.findall(
                            ".//{http://schemas.openxmlformats.org/drawingml/2006/main}t"
                        )
                    )
                    == "24"
                )
                number_body = number_shape.find(
                    ".//{http://schemas.openxmlformats.org/drawingml/2006/main}bodyPr"
                )
                self.assertIsNotNone(number_body)
                self.assertEqual(number_body.get("wrap"), "none")
                self.assertEqual(
                    len(
                        number_shape.findall(
                            ".//{http://schemas.openxmlformats.org/drawingml/2006/main}br"
                        )
                    ),
                    0,
                )

                title_shape = next(
                    shape
                    for shape in shapes
                    if "韧性生长，" in "".join(
                        node.text or ""
                        for node in shape.findall(
                            ".//{http://schemas.openxmlformats.org/drawingml/2006/main}t"
                        )
                    )
                )
                title_body = title_shape.find(
                    ".//{http://schemas.openxmlformats.org/drawingml/2006/main}bodyPr"
                )
                self.assertIsNotNone(title_body)
                self.assertEqual(title_body.get("wrap"), "none")
                self.assertEqual(
                    len(
                        title_shape.findall(
                            ".//{http://schemas.openxmlformats.org/drawingml/2006/main}br"
                        )
                    ),
                    1,
                )

    def test_pptx_export_normalizes_each_slide_in_a_bounded_browser_document(self) -> None:
        presentation = dataclasses.asdict(legacy_cover_presentation(slide_count=3))

        with patch.object(
            compiler_module,
            "normalize_canonical_text_layout",
            side_effect=successful_normalizer,
            create=True,
        ) as normalize, patch.object(
            compiler_module,
            "recycle_browser_snapshot_worker",
        ) as recycle:
            export_ir_to_pptx(presentation)

        self.assertEqual(normalize.call_count, 3)
        recycle.assert_called_once_with()
        for expected_index, call in enumerate(normalize.call_args_list):
            source, bounded_presentation = call.args
            self.assertEqual(len(bounded_presentation.slides), 1)
            self.assertEqual(bounded_presentation.slides[0].index, expected_index)
            self.assertEqual(source.count("PPTX2HTML_SLIDE_START:"), 1)

    def test_text_layout_snapshot_skips_unused_png_capture(self) -> None:
        with patch.object(
            compiler_module,
            "_invoke_browser_snapshot",
            return_value={"success": True, "snapshot": {"nodes": []}},
        ) as invoke:
            compiler_module._run_browser_snapshot(
                source="<html><body></body></html>",
                base_url=None,
                viewport=(1280, 720),
                timeout_ms=20000,
                max_dom_nodes=5000,
                include_screenshot=False,
            )

        payload = invoke.call_args.args[0]
        self.assertIs(payload["skip_screenshot"], True)

    def test_stale_htmlir_snapshot_is_remeasured_even_without_dirty_flag(self) -> None:
        frame = text_frame(htmlir=True, dirty=False)
        frame.layout_snapshot = TextLayoutSnapshot(
            source_sha256="0" * 64,
            metrics_sha256="0" * 64,
        )
        presentation = one_text_slide(frame)

        with patch.object(
            compiler_module,
            "normalize_canonical_text_layout",
            side_effect=successful_normalizer,
            create=True,
        ) as normalize:
            result = render_ir_to_canonical(
                dataclasses.asdict(presentation),
                normalize_text_layout=True,
            )

        normalize.assert_called_once()
        returned = result["presentation"]["slides"][0]["shapes"][0]["text"]
        self.assertNotEqual(returned["layout_snapshot"]["source_sha256"], "0" * 64)
        self.assertFalse(returned["layout_snapshot_dirty"])

    def test_real_chromium_normalizes_nonzero_slide_index_and_table_cell(self) -> None:
        shape_frame = text_frame(
            "A long editable shape line that Chromium wraps at stable visual boundaries"
        )
        cell_frame = text_frame(
            "A long editable table cell line that Chromium also wraps consistently"
        )
        presentation = Presentation(
            width=960.0,
            height=540.0,
            slides=[
                Slide(
                    index=9,
                    shapes=[
                        Shape(
                            type="auto_shape",
                            bounds=Bounds(20.0, 20.0, 150.0, 80.0),
                            text=shape_frame,
                        ),
                        Shape(
                            type="graphic_frame",
                            bounds=Bounds(200.0, 20.0, 140.0, 80.0),
                            table=TableInfo(
                                rows=[[TableCell(text_frame=cell_frame)]],
                                col_widths=[140.0],
                                row_heights=[80.0],
                            ),
                        ),
                    ],
                )
            ],
        )

        result = render_ir_to_canonical(
            dataclasses.asdict(presentation),
            normalize_text_layout=True,
        )

        returned_shapes = result["presentation"]["slides"][0]["shapes"]
        returned_frames = [
            returned_shapes[0]["text"],
            returned_shapes[1]["table"]["rows"][0][0]["text_frame"],
        ]
        self.assertTrue(result["text_layout_normalized"])
        self.assertEqual(result["normalized_text_frame_count"], 2)
        self.assertEqual(result["unresolved_text_frame_count"], 0)
        self.assertTrue(all(frame["layout_snapshot"] for frame in returned_frames))
        self.assertTrue(all(not frame["layout_snapshot_dirty"] for frame in returned_frames))

    def test_browser_layout_excludes_canonical_bullet_marker_text(self) -> None:
        source = CanonicalHtmlRenderer().render(
            self._bullet_blank_and_field_presentation()
        )
        snapshot = compiler_module._run_browser_snapshot(
            source=source,
            base_url=None,
            viewport=(1280, 720),
            timeout_ms=15_000,
            max_dom_nodes=50_000,
        )
        ast = compiler_module._ast_from_snapshot(snapshot)
        paragraphs = [
            node
            for node in ast["nodes"]
            if "pptx-paragraph"
            in str((node.get("attributes") or {}).get("class") or "").split()
        ]

        first_layout = paragraphs[0]["visualTextLayout"]
        expected = "Bullet content that wraps across the narrow text box"
        self.assertTrue(first_layout["reliable"])
        self.assertEqual(first_layout["sourceText"], expected)
        self.assertNotIn("•", first_layout["sourceText"])
        self.assertEqual(
            "".join(
                str(run.get("text") or "")
                for run in paragraphs[0]["richTextRuns"]
                if run.get("kind") == "text"
            ),
            expected,
        )

    def test_real_chromium_normalizes_bullet_field_and_blank_paragraph_indices(self) -> None:
        result = render_ir_to_canonical(
            dataclasses.asdict(self._bullet_blank_and_field_presentation()),
            normalize_text_layout=True,
        )

        returned = result["presentation"]["slides"][0]["shapes"][0]["text"]
        snapshot = returned["layout_snapshot"]
        self.assertTrue(result["text_layout_normalized"])
        self.assertEqual(result["normalized_text_frame_count"], 1)
        self.assertIsNotNone(snapshot)
        self.assertFalse(returned["layout_snapshot_dirty"])
        self.assertEqual(len(returned["paragraphs"]), 4)
        self.assertEqual(returned["paragraphs"][1]["runs"], [])
        self.assertEqual(returned["paragraphs"][2]["runs"][0]["text"], "")
        field = returned["paragraphs"][3]["runs"][0]
        self.assertEqual(field["kind"], "field")
        self.assertEqual(field["field_id"], "field-7")
        self.assertEqual(field["field_type"], "slidenum")
        break_paragraphs = {
            item["paragraph_index"] for item in snapshot["soft_breaks"]
        }
        self.assertIn(0, break_paragraphs)
        self.assertIn(3, break_paragraphs)
        self.assertNotIn(1, break_paragraphs)
        self.assertNotIn(2, break_paragraphs)

    def test_legacy_layout_dirty_is_read_but_never_written(self) -> None:
        payload = dataclasses.asdict(one_text_slide(text_frame(htmlir=False)))
        frame = payload["slides"][0]["shapes"][0]["text"]
        frame.pop("layout_snapshot_dirty")
        frame["layout_dirty"] = True

        with patch.object(
            compiler_module,
            "normalize_canonical_text_layout",
            side_effect=successful_normalizer,
            create=True,
        ):
            result = render_ir_to_canonical(payload, normalize_text_layout=True)

        returned = result["presentation"]["slides"][0]["shapes"][0]["text"]
        self.assertNotIn("layout_dirty", returned)
        self.assertFalse(returned["layout_snapshot_dirty"])

    def test_failure_clears_old_snapshot_and_returns_only_compact_asset_ir(self) -> None:
        frame = text_frame(dirty=True)
        frame.layout_snapshot = TextLayoutSnapshot(
            source_sha256="0" * 64,
            metrics_sha256="0" * 64,
        )
        presentation = one_text_slide(frame)
        raw_image = b"editor-layout-image-bytes"
        encoded = base64.b64encode(raw_image).decode("ascii")
        digest = hashlib.sha256(raw_image).hexdigest()
        presentation.slides[0].shapes.append(
            Shape(
                type="picture",
                bounds=Bounds(400.0, 60.0, 120.0, 80.0),
                image=ImageInfo(content_type="image/png", data=encoded),
            )
        )

        with patch.object(
            compiler_module,
            "normalize_canonical_text_layout",
            side_effect=RuntimeError("browser unavailable"),
            create=True,
        ):
            result = render_ir_to_canonical(
                dataclasses.asdict(presentation),
                normalize_text_layout=True,
            )

        returned = result["presentation"]
        returned_frame = returned["slides"][0]["shapes"][0]["text"]
        returned_image = returned["slides"][0]["shapes"][1]["image"]
        self.assertIsNone(returned_frame["layout_snapshot"])
        self.assertTrue(returned_frame["layout_snapshot_dirty"])
        self.assertFalse(result["text_layout_normalized"])
        self.assertEqual(result["unresolved_text_frame_count"], 1)
        self.assertEqual(
            returned_image["data"],
            f"yrkie-asset-base64://{digest}",
        )
        self.assertNotIn(encoded, result["html"])
        self.assertNotIn(encoded, json.dumps(returned))
        self.assertEqual(
            sum(asset["data_base64"] == encoded for asset in result["assets"]),
            1,
        )


class CanonicalHtmlNormalizationHttpTests(unittest.TestCase):
    TOKEN = "htmlir-layout-test-token-0123456789"

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

    def test_endpoint_requires_boolean_normalize_text_layout(self) -> None:
        body = json.dumps(
            {
                "presentation": {"slides": [{}]},
                "normalize_text_layout": "true",
            }
        ).encode("utf-8")
        connection = http.client.HTTPConnection(
            "127.0.0.1",
            self.server.server_address[1],
            timeout=2,
        )
        connection.request(
            "POST",
            "/api/ir/canonical-html",
            body=body,
            headers={
                "Authorization": f"Bearer {self.TOKEN}",
                "Content-Type": "application/json",
            },
        )
        response = connection.getresponse()
        payload = json.loads(response.read())
        connection.close()

        self.assertEqual(response.status, 400)
        self.assertIn("normalize_text_layout", payload["error"])


if __name__ == "__main__":
    unittest.main()
