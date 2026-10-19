from __future__ import annotations

import sys
import json
import unittest
from pathlib import Path
from modular_patch import patch


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx_pipeline import (  # noqa: E402
    normalize_slide_fragment,
    parse_slide_fragments_to_ir,
)
from pptx2html.htmlir.compiler import HtmlCompileError, HtmlDiagnostic  # noqa: E402


class SlideFragmentNormalizationTests(unittest.TestCase):
    def test_complete_html_document_is_unwrapped_to_its_single_body_div(self) -> None:
        source = """<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"></head>
<body>
  <div class="w-[1920px] h-[1080px]">
    <p element-type="text">content</p>
  </div>
</body>
</html>"""

        self.assertEqual(
            normalize_slide_fragment(source),
            """<div class="w-[1920px] h-[1080px]">
    <p element-type="text">content</p>
  </div>""",
        )

    def test_body_still_requires_exactly_one_root_slide_container(self) -> None:
        source = "<html><body><div>first</div><div>second</div></body></html>"

        with self.assertRaisesRegex(ValueError, "exactly one root slide container"):
            normalize_slide_fragment(source)

    def test_section_is_accepted_as_a_single_slide_root(self) -> None:
        source = (
            '<section class="absolute w-full h-full" '
            'data-ethera-element="slide-cover">'
            '<div element-type="text">Title</div>'
            "</section>"
        )

        self.assertEqual(normalize_slide_fragment(source), source)

    def test_serialized_json_and_markdown_wrappers_are_unwrapped(self) -> None:
        source = '<section class="slide">content</section>'

        self.assertEqual(
            normalize_slide_fragment(json.dumps({"slideContent": source})),
            source,
        )
        self.assertEqual(
            normalize_slide_fragment(f"```html\n{source}\n```"),
            source,
        )

    def test_two_documents_are_not_silently_merged_into_one_slide(self) -> None:
        source = (
            "<html><body><div>first</div></body></html>"
            "<html><body><div>second</div></body></html>"
        )

        results = parse_slide_fragments_to_ir([{"id": "page-1", "fragment": source}])

        self.assertEqual(len(results), 1)
        self.assertFalse(results[0]["success"])
        self.assertEqual(results[0]["error_kind"], "content")
        self.assertIn("multiple HTML documents", results[0]["error"])
        self.assertIn("separate slide item", results[0]["error"])

    def test_canonical_failure_surfaces_the_specific_browser_diagnostic(self) -> None:
        source = (
            '<html data-pptx2html-canonical="1"><body>'
            '<section data-pptx2html-slide="1"></section></body></html>'
        )
        failure = HtmlCompileError(
            "html browser snapshot failed",
            [HtmlDiagnostic("error", "snapshot-failed", "Specific Chromium failure.")],
        )

        with patch("pptx_pipeline.parse_html_to_ir", side_effect=failure):
            result = parse_slide_fragments_to_ir([{"id": "page-1", "fragment": source}])[0]

        self.assertFalse(result["success"])
        self.assertEqual(result["error"], "Specific Chromium failure.")
        self.assertEqual(result["diagnostics"][0]["code"], "snapshot-failed")

    def test_fragment_security_validation_runs_after_document_unwrap(self) -> None:
        source = '<html><body><div><img src="x" onerror="alert(1)"></div></body></html>'

        with self.assertRaisesRegex(ValueError, "Event attributes are not allowed"):
            normalize_slide_fragment(source)

    def test_safe_nested_stylesheet_and_animation_are_rendered_at_final_state(self) -> None:
        source = """<div class="w-full h-full bg-slate-900">
  <div class="opacity-0 animate-[fadeIn_1s_ease-out_forwards]"
       element-name="animated-title" element-type="text">Visible title</div>
  <style>
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</div>"""

        self.assertEqual(normalize_slide_fragment(source), source)
        result = parse_slide_fragments_to_ir(
            [{"id": "safe-style", "fragment": source}],
            include_ast=True,
            include_browser_screenshot=True,
            viewport=(1920, 1080),
            concurrency=1,
        )[0]

        self.assertTrue(result["success"])
        self.assertIn(
            "css-animations-finalized",
            [item["code"] for item in result["diagnostics"]],
        )
        title = next(
            node
            for node in result["ast"]["nodes"]
            if node.get("attributes", {}).get("element-name") == "animated-title"
        )
        self.assertEqual(title["computed"]["opacity"], "1")
        self.assertIn(
            title["computed"]["transform"],
            {"none", "matrix(1, 0, 0, 1, 0, 0)"},
        )
        self.assertTrue(result["browser_screenshot_png_base64"])

    def test_social_card_viewport_compiles_to_a_full_portrait_presentation(self) -> None:
        source = """<section class="w-full h-full bg-slate-900">
  <h1 class="text-white">Portrait card</h1>
</section>"""

        result = parse_slide_fragments_to_ir(
            [{"id": "portrait-card", "fragment": source}],
            include_ast=True,
            include_browser_screenshot=False,
            viewport=(1080, 1440),
            concurrency=1,
        )[0]

        self.assertTrue(result["success"])
        presentation = result["presentation"]
        self.assertEqual((presentation["width"], presentation["height"]), (540.0, 720.0))
        background = next(
            shape
            for shape in presentation["slides"][0]["shapes"]
            if "htmlir:background" in shape.get("diagnostics", [])
        )
        self.assertEqual(
            background["bounds"],
            {"left": 0.0, "top": 0.0, "width": 540.0, "height": 720.0},
        )

    def test_traditional_viewport_keeps_the_existing_widescreen_contract(self) -> None:
        result = parse_slide_fragments_to_ir(
            [
                {
                    "id": "traditional-slide",
                    "fragment": '<section class="w-full h-full bg-slate-900"></section>',
                }
            ],
            include_ast=False,
            include_browser_screenshot=False,
            viewport=(1920, 1080),
            concurrency=1,
        )[0]

        self.assertTrue(result["success"])
        self.assertEqual(
            (result["presentation"]["width"], result["presentation"]["height"]),
            (960.0, 540.0),
        )

    def test_network_stylesheet_inside_fragment_remains_rejected(self) -> None:
        source = """<div class="w-full h-full">
  <style>@import url("https://example.com/slide.css");</style>
</div>"""

        result = parse_slide_fragments_to_ir(
            [{"id": "network-style", "fragment": source}],
            include_browser_screenshot=True,
            viewport=(1920, 1080),
            concurrency=1,
        )[0]

        self.assertFalse(result["success"])
        self.assertEqual(result["error_kind"], "content")
        self.assertIn("network or active URL in stylesheet is not allowed", result["error"])

    def test_multiple_animations_preserve_css_composite_order_at_final_state(self) -> None:
        source = """<div class="w-full h-full">
  <div id="target" element-name="animated-title" element-type="text">Visible title</div>
  <style>
    #target {
      opacity: 0;
      animation: first 1s linear forwards, second 1s linear forwards;
    }
    @keyframes first { to { opacity: .4; } }
    @keyframes second { to { opacity: .8; } }
  </style>
</div>"""

        result = parse_slide_fragments_to_ir(
            [{"id": "composite-order", "fragment": source}],
            include_ast=True,
            include_browser_screenshot=False,
            viewport=(1920, 1080),
            concurrency=1,
        )[0]

        self.assertTrue(result["success"])
        title = next(
            node
            for node in result["ast"]["nodes"]
            if node.get("attributes", {}).get("element-name") == "animated-title"
        )
        self.assertEqual(title["computed"]["opacity"], "0.8")


if __name__ == "__main__":
    unittest.main()
