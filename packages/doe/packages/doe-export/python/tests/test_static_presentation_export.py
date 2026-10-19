from __future__ import annotations

import base64
import io
import re
import sys
import unittest
import zipfile
from pathlib import Path
from modular_patch import patch

from PIL import Image

try:
    import fitz
except ImportError:  # pragma: no cover - optional local visual assertion
    fitz = None


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx_pipeline import (  # noqa: E402
    _presentation_ir_without_export_watermarks,
    _static_export_html,
    export_ir_to_pdf,
    export_ir_to_png_zip,
)
from pptx2html.htmlir import HtmlCompileError  # noqa: E402
from pptx2html.htmlir import compiler as compiler_module  # noqa: E402


def two_slide_presentation() -> dict:
    return {
        "width": 960,
        "height": 540,
        "slides": [
            {
                "index": 0,
                "name": "Red slide",
                "background": {"fill": {"type": "solid", "color": "E5484D"}},
                "shapes": [],
            },
            {
                "index": 1,
                "name": "Blue slide",
                "background": {"fill": {"type": "solid", "color": "2563EB"}},
                "shapes": [],
            },
        ],
    }


def portrait_card_presentation() -> dict:
    return {
        "width": 540,
        "height": 720,
        "slides": [
            {
                "index": 0,
                "name": "Portrait card",
                "background": {"fill": {"type": "solid", "color": "E5484D"}},
                "shapes": [],
            }
        ],
    }


def solid_png_data_url(color: tuple[int, int, int]) -> str:
    image_buffer = io.BytesIO()
    Image.new("RGB", (32, 32), color).save(image_buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(image_buffer.getvalue()).decode("ascii")


def delayed_image_html(delay_ms: int = 1500) -> str:
    image_url = solid_png_data_url((236, 45, 63))
    return f"""<!doctype html>
<html>
<head>
  <style>
    html, body {{ margin: 0; padding: 0; background: #ffffff; }}
    .pptx-canonical-deck {{ margin: 0; padding: 0; }}
    .pptx-slide.pptx-canonical-slide {{
      position: relative;
      width: 960pt;
      height: 540pt;
      overflow: hidden;
      background: #ffffff;
      break-after: page;
    }}
    #late-export-image {{
      position: absolute;
      left: 360pt;
      top: 150pt;
      width: 240pt;
      height: 240pt;
    }}
  </style>
</head>
<body>
  <main class="pptx-canonical-deck">
    <section class="pptx-slide pptx-canonical-slide">
      <img id="late-export-image" width="320" height="320" alt="delayed export fixture">
    </section>
  </main>
  <script>
    window.setTimeout(() => {{
      document.getElementById("late-export-image").src = {image_url!r};
    }}, {delay_ms});
  </script>
</body>
</html>"""


def broken_image_html() -> str:
    return """<!doctype html>
<html><head><style>
html, body { margin: 0; padding: 0; }
.pptx-slide { position: relative; width: 960pt; height: 540pt; background: white; }
img { position: absolute; inset: 120pt; width: 240pt; height: 240pt; }
</style></head><body>
<section class="pptx-slide pptx-canonical-slide">
  <img src="data:image/png;base64,AAAA" alt="intentionally broken export fixture">
</section>
</body></html>"""


def broken_background_image_html() -> str:
    return """<!doctype html>
<html><head><style>
html, body { margin: 0; padding: 0; }
.pptx-slide {
  position: relative;
  width: 960pt;
  height: 540pt;
  background: white url("data:image/png;base64,AAAA") center / 240pt 240pt no-repeat;
}
</style></head><body>
<section class="pptx-slide pptx-canonical-slide"></section>
</body></html>"""


def hidden_broken_images_html() -> str:
    return """<!doctype html>
<html><head><style>
html, body { margin: 0; padding: 0; }
.pptx-slide { width: 960pt; height: 540pt; background: rgb(255, 255, 255); }
.hidden-broken { display: none; background-image: url("data:image/png;base64,AAAA"); }
</style></head><body>
<section class="pptx-slide pptx-canonical-slide">
  <div class="hidden-broken"><img alt="hidden image without a source"></div>
</section>
</body></html>"""


def image_set_html() -> str:
    selected = solid_png_data_url((33, 150, 83))
    return f"""<!doctype html>
<html><head><style>
html, body {{ margin: 0; padding: 0; }}
.pptx-slide {{
  width: 960pt;
  height: 540pt;
  background: image-set(
    url("data:image/png;base64,AAAA") 1x,
    url("{selected}") 2x
  ) center / cover no-repeat;
}}
</style></head><body>
<section class="pptx-slide pptx-canonical-slide"></section>
</body></html>"""


def changing_image_source_html() -> str:
    first = solid_png_data_url((236, 45, 63))
    final = solid_png_data_url((37, 99, 235))
    return f"""<!doctype html>
<html><head><style>
html, body {{ margin: 0; padding: 0; }}
.pptx-slide {{ position: relative; width: 960pt; height: 540pt; background: white; }}
img {{ position: absolute; inset: 0; width: 960pt; height: 540pt; }}
</style></head><body>
<section class="pptx-slide pptx-canonical-slide">
  <img id="changing-export-image" src="{first}" alt="changing export fixture">
</section>
<script>
  window.setTimeout(() => document.getElementById("changing-export-image").removeAttribute("src"), 20);
  window.setTimeout(() => {{ document.getElementById("changing-export-image").src = "{final}"; }}, 1000);
</script>
</body></html>"""


def animated_image_source_html() -> str:
    stable = solid_png_data_url((250, 180, 30))
    return f"""<!doctype html>
<html><head><style>
html, body {{ margin: 0; padding: 0; }}
.pptx-slide {{
  width: 960pt;
  height: 540pt;
  background: url("{stable}") center / cover no-repeat;
  animation: replace-export-image 10s linear forwards;
}}
@keyframes replace-export-image {{
  to {{ background-image: url("data:image/png;base64,AAAA"); }}
}}
</style></head><body>
<section class="pptx-slide pptx-canonical-slide"></section>
</body></html>"""


class StaticPresentationExportTests(unittest.TestCase):
    def test_screenshot_capture_recycles_and_retries_a_runtime_failure(self) -> None:
        png = b"\x89PNG\r\n\x1a\nretry"
        runtime_failure = {
            "success": True,
            "results": [
                {
                    "success": False,
                    "error": "Target page closed.",
                    "error_kind": "runtime",
                }
            ],
        }
        success = {
            "success": True,
            "results": [
                {
                    "success": True,
                    "screenshot_png_base64": base64.b64encode(png).decode("ascii"),
                }
            ],
        }

        with patch.object(
            compiler_module,
            "_invoke_browser_snapshot",
            side_effect=[runtime_failure, success],
        ) as invoke, patch.object(
            compiler_module,
            "recycle_browser_snapshot_worker",
        ) as recycle:
            result = compiler_module.capture_html_screenshots(
                [{"source": "<html><body></body></html>"}]
            )

        self.assertEqual(result, [png])
        self.assertEqual(invoke.call_count, 2)
        recycle.assert_called_once_with()

    def test_screenshot_capture_does_not_retry_a_content_failure(self) -> None:
        content_failure = {
            "success": True,
            "results": [
                {
                    "success": False,
                    "error": "Unsafe HTML rejected.",
                    "error_kind": "content",
                }
            ],
        }

        with patch.object(
            compiler_module,
            "_invoke_browser_snapshot",
            return_value=content_failure,
        ) as invoke, patch.object(
            compiler_module,
            "recycle_browser_snapshot_worker",
        ) as recycle:
            with self.assertRaises(HtmlCompileError):
                compiler_module.capture_html_screenshots(
                    [{"source": "<html><body></body></html>"}]
                )

        invoke.assert_called_once()
        recycle.assert_not_called()

    def test_png_export_disables_motion_before_discovering_image_sources(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"] = presentation["slides"][:1]

        with patch("pptx_pipeline.CanonicalHtmlRenderer.render", return_value=animated_image_source_html()):
            payload = export_ir_to_png_zip(presentation)

        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            with Image.open(io.BytesIO(archive.read("slide-001.png"))) as image:
                center = image.convert("RGB").getpixel((960, 540))

        self.assertEqual(center, (250, 180, 30))

    def test_png_export_ignores_non_drawable_broken_images(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"] = presentation["slides"][:1]

        with patch("pptx_pipeline.CanonicalHtmlRenderer.render", return_value=hidden_broken_images_html()):
            payload = export_ir_to_png_zip(presentation)

        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            with Image.open(io.BytesIO(archive.read("slide-001.png"))) as image:
                center = image.convert("RGB").getpixel((960, 540))

        self.assertEqual(center, (255, 255, 255))

    def test_png_export_rejects_unverifiable_image_set_candidates(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"] = presentation["slides"][:1]

        with patch("pptx_pipeline.CanonicalHtmlRenderer.render", return_value=image_set_html()):
            with self.assertRaises(HtmlCompileError) as raised:
                export_ir_to_png_zip(presentation)
        self.assertTrue(
            any(
                "unsupported CSS image function" in item.message
                for item in raised.exception.diagnostics
            )
        )

    def test_png_export_rejects_script_that_changes_an_image_source(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"] = presentation["slides"][:1]

        with patch("pptx_pipeline.CanonicalHtmlRenderer.render", return_value=changing_image_source_html()):
            with self.assertRaises(HtmlCompileError) as raised:
                export_ir_to_png_zip(presentation)
        self.assertTrue(any("Unsafe HTML" in item.message for item in raised.exception.diagnostics))

    def test_png_export_rejects_delayed_script_image_source(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"] = presentation["slides"][:1]

        with patch("pptx_pipeline.CanonicalHtmlRenderer.render", return_value=delayed_image_html()):
            with self.assertRaises(HtmlCompileError) as raised:
                export_ir_to_png_zip(presentation)
        self.assertTrue(any("Unsafe HTML" in item.message for item in raised.exception.diagnostics))

    def test_pdf_export_rejects_delayed_script_image_source(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"] = presentation["slides"][:1]

        with patch("pptx_pipeline.CanonicalHtmlRenderer.render", return_value=delayed_image_html()):
            with self.assertRaises(HtmlCompileError) as raised:
                export_ir_to_pdf(presentation)
        self.assertTrue(any("Unsafe HTML" in item.message for item in raised.exception.diagnostics))

    def test_png_export_rejects_a_broken_image_instead_of_returning_a_partial_file(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"] = presentation["slides"][:1]

        with patch("pptx_pipeline.CanonicalHtmlRenderer.render", return_value=broken_image_html()):
            with self.assertRaises(HtmlCompileError) as raised:
                export_ir_to_png_zip(presentation)

        self.assertTrue(raised.exception.diagnostics)
        self.assertIn("Export visual assets are not ready", raised.exception.diagnostics[0].message)

    def test_png_export_rejects_a_broken_css_background_image(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"] = presentation["slides"][:1]

        with patch("pptx_pipeline.CanonicalHtmlRenderer.render", return_value=broken_background_image_html()):
            with self.assertRaises(HtmlCompileError) as raised:
                export_ir_to_png_zip(presentation)

        self.assertTrue(raised.exception.diagnostics)
        self.assertIn("CSS/SVG image", raised.exception.diagnostics[0].message)

    def test_reimported_export_watermarks_are_removed_without_mutating_ir(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"][0]["shapes"] = [
            {"name": "Yrkie Export Watermark", "type": "picture"},
            {"name": "Keep me", "type": "auto_shape"},
        ]

        cleaned = _presentation_ir_without_export_watermarks(presentation)

        self.assertEqual(len(presentation["slides"][0]["shapes"]), 2)
        self.assertEqual(cleaned["slides"][0]["shapes"], [{"name": "Keep me", "type": "auto_shape"}])

    def test_watermark_css_is_export_only(self) -> None:
        source = '<html><head></head><body><div class="pptx-slide pptx-canonical-slide"></div></body></html>'

        plain = _static_export_html(source)
        watermarked = _static_export_html(source, export_watermark=True)

        self.assertNotIn("yrkie-export-watermark-style", plain)
        self.assertIn("yrkie-export-watermark-style", watermarked)
        self.assertIn("data:image/png;base64,", watermarked)
        self.assertIn(".pptx-slide.pptx-canonical-slide::after", watermarked)

    def test_pdf_contains_one_page_per_slide(self) -> None:
        payload = export_ir_to_pdf(two_slide_presentation())

        self.assertTrue(payload.startswith(b"%PDF-"))
        self.assertEqual(len(re.findall(rb"/Type\s*/Page\b", payload)), 2)

    def test_pdf_preserves_portrait_card_page_size_without_non_uniform_scaling(self) -> None:
        with patch("pptx_pipeline.print_html_to_pdf", return_value=b"%PDF-1.7") as print_pdf:
            payload = export_ir_to_pdf(portrait_card_presentation())

        self.assertEqual(payload, b"%PDF-1.7")
        source = print_pdf.call_args.args[0]
        self.assertEqual(print_pdf.call_args.kwargs["page_width_pt"], 540.0)
        self.assertEqual(print_pdf.call_args.kwargs["page_height_pt"], 720.0)
        self.assertIn("@page { size: 540pt 720pt; margin: 0; }", source)
        self.assertIn('data-width="540.000000" data-height="720.000000"', source)
        self.assertIn("width:540.000pt; height:720.000pt", source)
        self.assertIn("transform:scale(1.000000000, 1.000000000)", source)

    @unittest.skipIf(fitz is None, "PyMuPDF is not installed")
    def test_pdf_portrait_card_media_box_is_three_by_four(self) -> None:
        payload = export_ir_to_pdf(portrait_card_presentation())

        with fitz.open(stream=payload, filetype="pdf") as document:
            page = document[0]
            self.assertAlmostEqual(page.rect.width, 540.0, places=1)
            self.assertAlmostEqual(page.rect.height, 720.0, places=1)

    @unittest.skipIf(fitz is None, "PyMuPDF is not installed")
    def test_pdf_watermark_renders_the_same_branded_capsule(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"] = presentation["slides"][:1]
        payload = export_ir_to_pdf(presentation, export_watermark=True)

        with fitz.open(stream=payload, filetype="pdf") as document:
            pixmap = document[0].get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            with Image.open(io.BytesIO(pixmap.tobytes("png"))) as image:
                pixels = list(image.convert("RGB").crop((1660, 980, 1900, 1065)).getdata())

        self.assertGreater(sum(r > 245 and g > 245 and b > 245 for r, g, b in pixels), 5_000)
        self.assertGreater(sum(r < 70 and g < 70 and b < 70 for r, g, b in pixels), 250)
        self.assertGreater(sum(b > 140 and b > r + 30 for r, g, b in pixels), 250)

    def test_png_zip_contains_ordered_full_hd_slide_images(self) -> None:
        payload = export_ir_to_png_zip(two_slide_presentation())

        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            self.assertEqual(
                archive.namelist(),
                ["slide-001.png", "slide-002.png"],
            )
            center_pixels = []
            for name in archive.namelist():
                png = archive.read(name)
                self.assertTrue(png.startswith(b"\x89PNG\r\n\x1a\n"))
                with Image.open(io.BytesIO(png)) as image:
                    self.assertEqual(image.size, (1920, 1080))
                    self.assertEqual(image.format, "PNG")
                    center_pixels.append(image.convert("RGB").getpixel((960, 540)))

        self.assertEqual(center_pixels, [(229, 72, 77), (37, 99, 235)])

    def test_png_watermark_renders_the_white_capsule_text_and_wordmark(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"] = presentation["slides"][:1]
        payload = export_ir_to_png_zip(presentation, export_watermark=True)

        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            with Image.open(io.BytesIO(archive.read("slide-001.png"))) as image:
                pixels = list(image.convert("RGB").crop((1660, 980, 1900, 1065)).getdata())

        self.assertGreater(sum(r > 245 and g > 245 and b > 245 for r, g, b in pixels), 5_000)
        self.assertGreater(sum(r < 70 and g < 70 and b < 70 for r, g, b in pixels), 100)
        self.assertGreater(sum(b > 140 and b > r + 30 for r, g, b in pixels), 250)


if __name__ == "__main__":
    unittest.main()
