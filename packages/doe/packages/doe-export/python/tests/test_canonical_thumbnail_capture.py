from __future__ import annotations

import base64
import dataclasses
import hashlib
import io
import json
import sys
import unittest
from pathlib import Path

from PIL import Image, ImageDraw


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from htmlir_server import _thumbnail_webp_and_palette  # noqa: E402
from pptx_pipeline import render_ir_preview_png  # noqa: E402
from pptx2html.htmlir.compiler import compile_html, compile_slide_fragments  # noqa: E402
from pptx2html.ir.model import Background, Bounds, Fill, Presentation, Shape, Slide  # noqa: E402
from pptx2html.renderer.canonical_html_renderer import CanonicalHtmlRenderer  # noqa: E402


class CanonicalThumbnailCaptureTests(unittest.TestCase):
    def test_portrait_ir_is_the_thumbnail_source(self) -> None:
        presentation = Presentation(
            width=540.0,
            height=720.0,
            slides=[
                Slide(
                    index=0,
                    name="Portrait card",
                    background=Background(fill=Fill(type="solid", color="102A43")),
                    shapes=[
                        Shape(
                            type="auto_shape",
                            name="Square",
                            bounds=Bounds(135.0, 225.0, 270.0, 270.0),
                            geometry="rect",
                            fill=Fill(type="solid", color="F5F2EA"),
                        )
                    ],
                )
            ],
        )

        preview_png = render_ir_preview_png(dataclasses.asdict(presentation))
        preview = Image.open(io.BytesIO(preview_png)).convert("RGB")
        self.assertEqual(preview.size, (720, 960))

        thumbnail_base64, _ = _thumbnail_webp_and_palette(preview_png)
        thumbnail = Image.open(
            io.BytesIO(base64.b64decode(thumbnail_base64))
        ).convert("RGB")
        self.assertEqual(thumbnail.size, (240, 320))
        light_pixels = [
            (x, y)
            for y in range(thumbnail.height)
            for x in range(thumbnail.width)
            if all(channel > 220 for channel in thumbnail.getpixel((x, y)))
        ]
        bounds = (
            min(x for x, _ in light_pixels),
            min(y for _, y in light_pixels),
            max(x for x, _ in light_pixels),
            max(y for _, y in light_pixels),
        )
        self.assertLessEqual(abs((bounds[2] - bounds[0]) - (bounds[3] - bounds[1])), 1)

    def test_portrait_thumbnail_preserves_aspect_ratio_and_square_geometry(self) -> None:
        source = Image.new("RGB", (1080, 1440), (16, 42, 67))
        ImageDraw.Draw(source).rectangle((180, 360, 899, 1079), fill=(245, 242, 234))
        source_bytes = io.BytesIO()
        source.save(source_bytes, format="PNG")

        thumbnail_base64, _ = _thumbnail_webp_and_palette(
            base64.b64encode(source_bytes.getvalue()).decode("ascii")
        )

        thumbnail = Image.open(
            io.BytesIO(base64.b64decode(thumbnail_base64))
        ).convert("RGB")
        self.assertEqual(thumbnail.size, (240, 320))
        light_pixels = [
            (x, y)
            for y in range(thumbnail.height)
            for x in range(thumbnail.width)
            if all(channel > 220 for channel in thumbnail.getpixel((x, y)))
        ]
        bounds = (
            min(x for x, _ in light_pixels),
            min(y for _, y in light_pixels),
            max(x for x, _ in light_pixels),
            max(y for _, y in light_pixels),
        )
        self.assertLessEqual(abs((bounds[2] - bounds[0]) - (bounds[3] - bounds[1])), 1)

    def test_batch_captures_exact_slide_without_outer_document_whitespace(self) -> None:
        presentation = Presentation(
            width=960.0,
            height=540.0,
            slides=[
                Slide(
                    index=0,
                    name="Full red slide",
                    background=Background(fill=Fill(type="solid", color="FF0000")),
                )
            ],
        )
        canonical_html = CanonicalHtmlRenderer().render(presentation)

        result = compile_slide_fragments(
            [{"id": "red-slide", "fragment": canonical_html}],
            include_ast=True,
            include_browser_screenshot=True,
            viewport=(1920, 1080),
            concurrency=1,
        )[0]

        self.assertTrue(result["success"])
        self.assertEqual(result["presentation"], dataclasses.asdict(presentation))
        self.assertEqual(result["diagnostics"][0]["code"], "canonical-html-lossless-snapshot")
        self.assertEqual(result["ast"]["nodes"][0]["tag"], "html")

        screenshot = Image.open(
            io.BytesIO(base64.b64decode(result["browser_screenshot_png_base64"]))
        ).convert("RGB")
        self.assertEqual(screenshot.size, (1280, 720))
        self._assert_red_corners(screenshot)

        thumbnail_base64, _ = _thumbnail_webp_and_palette(
            result["browser_screenshot_png_base64"]
        )
        thumbnail = Image.open(io.BytesIO(base64.b64decode(thumbnail_base64))).convert("RGB")
        self.assertEqual(thumbnail.size, (320, 180))
        self._assert_red_corners(thumbnail)

    def test_batch_recovers_legacy_copyist_numeric_slide_marker(self) -> None:
        presentation = Presentation(
            width=960.0,
            height=540.0,
            slides=[
                Slide(
                    index=5,
                    name="Legacy Copyist page",
                    background=Background(fill=Fill(type="solid", color="FF0000")),
                )
            ],
        )
        canonical_html = CanonicalHtmlRenderer().render(presentation).replace(
            'data-pptx2html-slide="1"',
            'data-pptx2html-slide="6"',
            1,
        )

        result = compile_slide_fragments(
            [{"id": "legacy-copyist", "fragment": canonical_html, "slide_index": 5}],
            include_ast=False,
            include_browser_screenshot=True,
            viewport=(1920, 1080),
            concurrency=1,
        )[0]

        self.assertTrue(result["success"])
        self.assertEqual(len(result["presentation"]["slides"]), 1)
        self.assertEqual(result["presentation"]["slides"][0]["index"], 5)
        self.assertEqual(result["diagnostics"][0]["code"], "canonical-ir-reconciled")
        screenshot = Image.open(
            io.BytesIO(base64.b64decode(result["browser_screenshot_png_base64"]))
        ).convert("RGB")
        self.assertEqual(screenshot.size, (1280, 720))
        self._assert_red_corners(screenshot)

    def test_batch_ignores_double_escaped_untrusted_canonical_payload(self) -> None:
        canonical_html = r'''<!DOCTYPE html>
<html data-pptx2html-canonical="1">
<head><meta charset="UTF-8"><style>
html, body, main { margin: 0; width: 100%; height: 100%; }
.pptx-slide { display: block; }
</style></head>
<body data-pptx2html-canonical="1">
<main data-pptx2html-canonical="1" data-original-width="960" data-original-height="540">
<section class="pptx-slide" data-pptx2html-slide="1" data-slide-index="0"
  data-width="960" data-height="540" style="width:960pt;height:540pt;background:#ff0000">
  <div style="position:absolute;left:24pt;top:24pt;color:white">Recovered DOM</div>
</section>
</main>
<script id=\"pptx2html-canonical-ir\" type=\"application/json\" data-pptx2html-ir=\"1\">{\"format\":\"pptx2html-canonical-ir\",\"version\":1,\"presentation\":{\"width\":960,\"height\":540}}</script>
</body></html>'''

        result = compile_slide_fragments(
            [{"id": "escaped-payload", "fragment": canonical_html}],
            include_ast=True,
            include_browser_screenshot=True,
            viewport=(1920, 1080),
            concurrency=1,
        )[0]

        self.assertTrue(result["success"])
        self.assertEqual(len(result["presentation"]["slides"]), 1)
        self.assertEqual(result["diagnostics"][0]["code"], "canonical-html-deck")
        screenshot = Image.open(
            io.BytesIO(base64.b64decode(result["browser_screenshot_png_base64"]))
        ).convert("RGB")
        self.assertEqual(screenshot.size, (1280, 720))
        self._assert_red_corners(screenshot)

    def test_batch_still_rejects_an_actual_active_script(self) -> None:
        fragment = '''<div style="width:1920px;height:1080px">
<script>alert("unsafe")</script>
</div>'''

        result = compile_slide_fragments(
            [{"id": "active-script", "fragment": fragment}],
            include_browser_screenshot=True,
            concurrency=1,
        )[0]

        self.assertFalse(result["success"])
        self.assertEqual(result["error_kind"], "content")
        self.assertIn("active elements are not allowed", result["error"])

    def test_canonical_recovers_tailwind_and_strips_all_active_scripts(self) -> None:
        slide_fragment = '''<!-- PPTX2HTML_SLIDE_START:0 -->
<section class="pptx-slide" data-pptx2html-slide="1" data-slide-index="0"
 data-width="1920" data-height="1080" style="width:1920px;height:1080px">
<div data-pptx2html-layer="1" style="width:1920px;height:1080px">
  <div class="absolute left-[120px] top-[80px] w-[400px] h-[200px] bg-brand-safe font-slide-safe"
   element-name="tailwind-card" element-type="shape">Recovered Tailwind</div>
</div></section>
<!-- PPTX2HTML_SLIDE_END:0 -->'''
        payload = {
            "format": "pptx2html-canonical-ir",
            "version": 1,
            "slide_hashes": [hashlib.sha256(slide_fragment.encode("utf-8")).hexdigest()],
            "presentation": {
                "width": 1920,
                "height": 1080,
                "slides": [{"index": 0, "shapes": []}],
            },
        }
        canonical_html = f'''<!DOCTYPE html>
<html data-pptx2html-canonical="1"><head>
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config = {{ theme: {{ extend: {{
  colors: {{ 'brand-safe': '#123456' }},
  fontFamily: {{ 'slide-safe': ['Test Sans', 'sans-serif'] }}
}} }} }}</script>
<script>window.thisMustNeverRun = true</script>
</head><body><main data-pptx2html-canonical="1">{slide_fragment}</main>
<script id="pptx2html-canonical-ir" type="application/json" data-pptx2html-ir="1">{json.dumps(payload, separators=(",", ":"))}</script>
</body></html>'''

        result = compile_slide_fragments(
            [{"id": "tailwind-recovery", "fragment": canonical_html}],
            include_ast=True,
            include_browser_screenshot=True,
            viewport=(1920, 1080),
            concurrency=1,
        )[0]

        self.assertTrue(result["success"])
        self.assertEqual(result["diagnostics"][0]["code"], "canonical-html-deck")
        self.assertIn(
            "canonical-payload-coverage-mismatch",
            [item["code"] for item in result["diagnostics"]],
        )
        self.assertGreaterEqual(len(result["presentation"]["slides"][0]["shapes"]), 1)
        card = next(
            node
            for node in result["ast"]["nodes"]
            if node.get("attributes", {}).get("element-name") == "tailwind-card"
        )
        self.assertEqual(card["computed"]["position"], "absolute")
        self.assertEqual(card["computed"]["backgroundColor"], "rgb(18, 52, 86)")
        self.assertIn("Test Sans", card["computed"]["fontFamily"])
        self.assertAlmostEqual(card["rect"]["left"], 120.0, places=1)
        self.assertAlmostEqual(card["rect"]["top"], 80.0, places=1)

    def test_escaped_canonical_section_recovers_attributes_and_base_styles(self) -> None:
        fragment = r'''<section id=\"pptx-slide-1\" class=\"pptx-slide pptx-canonical-slide\"
 data-pptx2html-slide=\"1\" data-slide-index=\"0\" data-width=\"960\" data-height=\"540\"
 style=\"width:960pt;height:540pt;background-color:#F5F3EF\">
<div class=\"pptx-canonical-layer\" data-pptx2html-layer=\"1\"
 style=\"width:960pt;height:540pt;transform:scale(1,1)\">
<div class=\"pptx-shape\" style=\"left:103.6pt;top:161.35pt;width:752.85pt;height:60.15pt\"
 data-pptx-shape-id=\"20\" data-pptx-shape-key=\"1\" element-name=\"主标题\" element-type=\"text\">
<div class=\"pptx-text-frame\" style=\"justify-content:flex-start;padding:3.6pt 7.2pt;overflow:visible\">
<p class=\"pptx-paragraph\" style=\"text-align:center;line-height:1\"><span class=\"pptx-run\"
 style=\"font-family:&quot;Microsoft YaHei&quot;,&quot;SimSun&quot;,sans-serif;font-size:48pt;font-weight:bold;color:#2C402E\">哲品茶 · 美工设计</span></p>
</div></div></div></section>'''

        result = compile_slide_fragments(
            [{"id": "escaped-canonical-section", "fragment": fragment}],
            include_ast=True,
            include_browser_screenshot=True,
            viewport=(1920, 1080),
            concurrency=1,
        )[0]

        self.assertTrue(result["success"])
        self.assertIn(
            "serialized-html-escape-recovered",
            [item["code"] for item in result["diagnostics"]],
        )
        shape = next(
            node
            for node in result["ast"]["nodes"]
            if node.get("attributes", {}).get("element-name") == "主标题"
        )
        title = next(
            node
            for node in result["ast"]["nodes"]
            if node.get("tag") == "span" and "哲品茶" in node.get("directText", "")
        )
        self.assertEqual(shape["attributes"]["class"], "pptx-shape")
        self.assertEqual(shape["computed"]["position"], "absolute")
        self.assertAlmostEqual(shape["rect"]["left"], 103.6 * 2, places=1)
        self.assertAlmostEqual(shape["rect"]["top"], 161.35 * 2, places=1)
        self.assertEqual(title["computed"]["fontSize"], "64px")
        self.assertEqual(title["computed"]["fontWeight"], "700")
        self.assertEqual(title["computed"]["color"], "rgb(44, 64, 46)")
        self.assertTrue(result["browser_screenshot_png_base64"])

    def test_standalone_canonical_section_fills_fragment_viewport(self) -> None:
        fragment = '''<section id="pptx-slide-1" class="pptx-slide pptx-canonical-slide"
 data-pptx2html-slide="1" data-slide-index="0" data-slide-name="Cover"
 data-width="960" data-height="540"
 style="width:960pt;height:540pt;background:#ff6600">
<div class="pptx-canonical-layer" data-pptx2html-layer="1"
 style="width:720pt;height:405pt;transform:scale(1.333333333,1.333333333)">
<div class="pptx-shape" style="left:54pt;top:110pt;width:612pt;height:80pt"
 element-name="title" element-type="text">
<div class="pptx-text-frame"><p class="pptx-paragraph"><span class="pptx-run"
 style="font-size:26pt;color:#fff">Cover title</span></p></div>
</div></div></section>'''

        result = compile_slide_fragments(
            [{"id": "standalone-canonical", "fragment": fragment}],
            include_ast=True,
            include_browser_screenshot=True,
            viewport=(1920, 1080),
            concurrency=1,
        )[0]

        self.assertTrue(result["success"])
        self.assertIn(
            "canonical-fragment-viewport-fit",
            [item["code"] for item in result["diagnostics"]],
        )
        root = result["ast"]["nodes"][0]
        title = next(
            node
            for node in result["ast"]["nodes"]
            if node.get("attributes", {}).get("element-name") == "title"
        )
        self.assertEqual(root["tag"], "section")
        self.assertAlmostEqual(root["rect"]["width"], 1920.0, places=1)
        self.assertAlmostEqual(root["rect"]["height"], 1080.0, places=1)
        self.assertAlmostEqual(title["rect"]["left"], 144.0, places=1)

        screenshot = Image.open(
            io.BytesIO(base64.b64decode(result["browser_screenshot_png_base64"]))
        ).convert("RGB")
        self.assertEqual(screenshot.size, (1920, 1080))
        for point in (
            (0, 0),
            (screenshot.width - 1, 0),
            (0, screenshot.height - 1),
            (screenshot.width - 1, screenshot.height - 1),
        ):
            red, green, blue = screenshot.getpixel(point)
            self.assertGreater(red, 220, point)
            self.assertGreater(green, 40, point)
            self.assertLess(green, 150, point)
            self.assertLess(blue, 40, point)

    def test_truncated_inert_canonical_payload_is_closed_and_rendered(self) -> None:
        presentation = Presentation(
            width=960.0,
            height=540.0,
            slides=[
                Slide(
                    index=0,
                    name="Truncated payload",
                    background=Background(fill=Fill(type="solid", color="FF0000")),
                )
            ],
        )
        canonical_html = CanonicalHtmlRenderer().render(presentation)
        payload_close = canonical_html.rfind("</script>")
        self.assertGreater(payload_close, 0)
        truncated_html = canonical_html[:payload_close]

        result = compile_html(
            truncated_html,
            include_ast=True,
            include_browser_screenshot=True,
            viewport=(1280, 720),
        )

        self.assertTrue(result["success"])
        self.assertIn(
            "truncated-canonical-payload-recovered",
            [item["code"] for item in result["diagnostics"]],
        )
        self.assertEqual(result["presentation"]["slides"][0]["name"], "Truncated payload")
        screenshot = Image.open(
            io.BytesIO(base64.b64decode(result["browser_screenshot_png_base64"]))
        ).convert("RGB")
        self._assert_red_corners(screenshot)

    def test_unclosed_active_script_is_still_rejected(self) -> None:
        result = compile_slide_fragments(
            [
                {
                    "id": "active-script",
                    "fragment": '<div class="w-full h-full">safe</div><script>alert(1)',
                }
            ],
            include_browser_screenshot=True,
            viewport=(1920, 1080),
            concurrency=1,
        )[0]

        self.assertFalse(result["success"])
        self.assertIn("active elements are not allowed", result["error"])

    def test_complete_json_escaped_canonical_document_recovers_css_and_payload(self) -> None:
        slide_fragment = '''<!-- PPTX2HTML_SLIDE_START:0 -->
<section class="pptx-slide pptx-canonical-slide" data-pptx2html-slide="1"
 data-slide-index="0" data-width="960" data-height="540"
 style="width:960pt;height:540pt;background:#121212">
<div data-pptx2html-layer="1" class="pptx-canonical-layer">
<div class="pptx-shape" style="left:36pt;top:36pt;width:888pt;height:468pt;border:1pt solid #D4AF37"
 element-name="frame" element-type="shape"></div>
</div></section>
<!-- PPTX2HTML_SLIDE_END:0 -->'''
        payload = {
            "format": "pptx2html-canonical-ir",
            "version": 1,
            "slide_hashes": [hashlib.sha256(slide_fragment.encode()).hexdigest()],
            "presentation": {
                "width": 960,
                "height": 540,
                "slides": [{"index": 0, "shapes": []}],
            },
        }
        document = f'''<!DOCTYPE html><html data-pptx2html-canonical="1"><head>
<style>body[data-pptx2html-canonical="1"] {{ overflow:auto; background:#123456 }}
.pptx-shape {{ position:absolute }}</style>
</head><body data-pptx2html-canonical="1"><main data-pptx2html-canonical="1">
{slide_fragment}</main>
<script id="pptx2html-canonical-ir" type="application/json" data-pptx2html-ir="1">{json.dumps(payload, separators=(",", ":"))}</script>
</body></html>'''
        escaped_document = json.dumps(document, ensure_ascii=False)[1:-1]

        result = compile_slide_fragments(
            [{"id": "escaped-document", "fragment": escaped_document}],
            include_ast=True,
            include_browser_screenshot=True,
            viewport=(1280, 720),
            concurrency=1,
        )[0]

        self.assertTrue(result["success"])
        self.assertIn(
            "serialized-html-escape-recovered",
            [item["code"] for item in result["diagnostics"]],
        )
        self.assertIn(
            "canonical-payload-coverage-mismatch",
            [item["code"] for item in result["diagnostics"]],
        )
        body = next(node for node in result["ast"]["nodes"] if node.get("tag") == "body")
        frame = next(
            node
            for node in result["ast"]["nodes"]
            if node.get("attributes", {}).get("element-name") == "frame"
        )
        self.assertEqual(body["computed"]["backgroundColor"], "rgb(18, 52, 86)")
        self.assertEqual(frame["computed"]["position"], "absolute")
        self.assertGreaterEqual(len(result["presentation"]["slides"][0]["shapes"]), 1)
        self.assertTrue(result["browser_screenshot_png_base64"])

        without_screenshot = compile_html(
            escaped_document,
            include_ast=False,
            include_browser_screenshot=False,
            viewport=(1280, 720),
        )
        self.assertGreaterEqual(
            len(without_screenshot["presentation"]["slides"][0]["shapes"]),
            1,
        )

    def test_batch_rebuilds_visible_shapes_when_payload_is_empty(self) -> None:
        payload = (
            '{"format":"pptx2html-canonical-ir","version":1,'
            '"slide_hashes":[],"presentation":{"width":960,"height":540,'
            '"slides":[{"index":0,"background":{"fill":{"type":"solid",'
            '"color":"FFFFFF"}},"shapes":[]}]}}'
        )

        def canonical_html(shape_attributes: str) -> str:
            return f'''<!DOCTYPE html>
<html data-pptx2html-canonical="1"><head><meta charset="UTF-8"><style>
html, body, main {{ margin:0; width:100%; height:100%; }}
.pptx-slide {{ display:block; position:relative; }}
.pptx-shape {{ position:absolute; box-sizing:border-box; }}
</style></head><body data-pptx2html-canonical="1">
<main data-pptx2html-canonical="1" data-original-width="960" data-original-height="540">
<section class="pptx-slide" data-pptx2html-slide="1" data-slide-index="0"
 data-width="960" data-height="540" style="width:960pt;height:540pt;background:#fff">
<div class="pptx-shape" {shape_attributes}
 style="left:60pt;top:60pt;width:300pt;height:120pt;background:#2563eb">
 <div class="pptx-text-frame"><p><span>Visible content</span></p></div>
</div></section></main>
<script id="pptx2html-canonical-ir" type="application/json" data-pptx2html-ir="1">{payload}</script>
</body></html>'''

        results = compile_slide_fragments(
            [
                {
                    "id": "keyed-shape",
                    "fragment": canonical_html(
                        'data-pptx-shape-id="7" data-pptx-shape-key="0"'
                    ),
                },
                {"id": "unkeyed-shape", "fragment": canonical_html("")},
            ],
            include_ast=True,
            include_browser_screenshot=True,
            viewport=(1920, 1080),
            concurrency=2,
        )

        for result in results:
            self.assertTrue(result["success"])
            self.assertEqual(result["diagnostics"][0]["code"], "canonical-html-deck")
            slides = result["presentation"]["slides"]
            self.assertEqual(len(slides), 1)
            self.assertGreaterEqual(len(slides[0]["shapes"]), 1)
            self.assertTrue(result["browser_screenshot_png_base64"])

    def test_nested_inline_formatting_is_not_emitted_as_duplicate_text_shapes(self) -> None:
        canonical_html = '''<!DOCTYPE html>
<html data-pptx2html-canonical="1"><head><meta charset="UTF-8"><style>
html, body, main { margin:0; width:100%; height:100%; }
.pptx-slide { display:block; position:relative; }
.pptx-shape { position:absolute; box-sizing:border-box; }
.pptx-text-frame { width:100%; height:100%; }
p { margin:0; }
</style></head><body data-pptx2html-canonical="1">
<main data-pptx2html-canonical="1" data-original-width="960" data-original-height="540">
<section class="pptx-slide" data-pptx2html-slide="1" data-slide-index="0"
 data-width="960" data-height="540" style="width:960pt;height:540pt;background:#fff">
<div class="pptx-shape" style="left:60pt;top:60pt;width:360pt;height:160pt">
 <div class="pptx-text-frame"><p style="font-size:18pt;line-height:1.5">
  <span>• <b>专业代运营团队</b>，提供账户搭建与素材制作<br>• 普通正文</span>
 </p></div>
</div></section></main>
<script id="pptx2html-canonical-ir" type="application/json" data-pptx2html-ir="1">
{"format":"pptx2html-canonical-ir","version":1,"slide_hashes":[],"presentation":{"width":960,"height":540,"slides":[{"index":0,"shapes":[]}]}}
</script></body></html>'''

        result = compile_html(
            canonical_html,
            include_ast=True,
            include_browser_screenshot=True,
            viewport=(1280, 720),
        )

        self.assertTrue(result["success"])
        shapes = result["presentation"]["slides"][0]["shapes"]
        text_shapes = [shape for shape in shapes if shape.get("text")]
        self.assertEqual(len(text_shapes), 1)
        paragraphs = text_shapes[0]["text"]["paragraphs"]
        runs = [run for paragraph in paragraphs for run in paragraph["runs"]]
        self.assertEqual(
            sum(str(run.get("text") or "").count("专业代运营团队") for run in runs),
            1,
        )
        bold_run = next(run for run in runs if "专业代运营团队" in str(run.get("text") or ""))
        self.assertTrue(bold_run["font"]["bold"])
        self.assertNotIn("html text b", [shape["name"] for shape in shapes])
        self.assertTrue(result["browser_screenshot_png_base64"])

    def _assert_red_corners(self, image: Image.Image) -> None:
        for point in (
            (0, 0),
            (image.width - 1, 0),
            (0, image.height - 1),
            (image.width - 1, image.height - 1),
        ):
            red, green, blue = image.getpixel(point)
            self.assertGreater(red, 200, point)
            self.assertLess(green, 40, point)
            self.assertLess(blue, 40, point)


if __name__ == "__main__":
    unittest.main()
