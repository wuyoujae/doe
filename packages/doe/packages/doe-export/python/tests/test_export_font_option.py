from __future__ import annotations

from test_paths import DOE_PUBLIC_ROOT

import sys
import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from modular_patch import patch
from zipfile import ZipFile

RUNTIME_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RUNTIME_ROOT))

from pptx_pipeline import export_ir_to_pptx, parse_html_to_ir
from schema_v4_export import export_schema_v4_deck_to_pptx
from schema_v4_fonts import remove_embedded_fonts


class ExportFontOptionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        html = '<section class="schema-slide"><p style="font:300 28px Alexandria,MiSans">Font choice 字体选择</p></section>'
        cls.ir = parse_html_to_ir(html, root_selector=".schema-slide", render_mode="semantic", timeout_ms=60_000)["presentation"]
        rendered = {
            "stylesheet": ".schema-slide{width:1280px;height:720px}",
            "slides": [{"root_html": html, "native_components": []}],
        }
        deck = {"version": 4, "deck": {"title": "Fonts", "slides": [{"id": "one"}]}}
        with (
            patch("schema_v4_export._render_schema_deck", return_value=rendered),
            patch("schema_v4_export.parse_html_to_ir", return_value={"presentation": cls.ir}),
        ):
            cls.enabled = export_schema_v4_deck_to_pptx(deck)
            cls.disabled = export_schema_v4_deck_to_pptx(deck, embed_fonts=False)

    def assert_no_fonts(self, payload):
        with ZipFile(BytesIO(payload)) as package:
            self.assertFalse(any(name.startswith("ppt/fonts/") for name in package.namelist()))
            self.assertNotIn(b"embeddedFontLst", package.read("ppt/presentation.xml"))
            self.assertNotIn(b"embedTrueTypeFonts", package.read("ppt/presentation.xml"))
            self.assertNotIn(b"/relationships/font", package.read("ppt/_rels/presentation.xml.rels"))
            self.assertNotIn(b"application/x-fontdata", package.read("[Content_Types].xml"))
            self.assertIsNone(package.testzip())

    def test_schema_default_embeds_actual_fonts_and_false_preserves_slide_contents(self):
        with ZipFile(BytesIO(self.enabled)) as included, ZipFile(BytesIO(self.disabled)) as excluded:
            self.assertTrue(any(name.startswith("ppt/fonts/") for name in included.namelist()))
            for name in included.namelist():
                if name.startswith("ppt/slides/"):
                    self.assertEqual(included.read(name), excluded.read(name), name)
            slide = included.read("ppt/slides/slide1.xml")
            self.assertIn("字体选择".encode(), slide)
            self.assertNotIn(b"normAutofit", slide)
        self.assert_no_fonts(self.disabled)
        self.assertLess(len(self.disabled), len(self.enabled))

    def test_removal_is_idempotent_and_leaves_all_non_font_content_intact(self):
        removed = remove_embedded_fonts(self.enabled)
        self.assert_no_fonts(removed)
        self.assertEqual(remove_embedded_fonts(removed), removed)
        with ZipFile(BytesIO(self.enabled)) as original, ZipFile(BytesIO(removed)) as output:
            for name in output.namelist():
                if name not in {"[Content_Types].xml", "ppt/presentation.xml", "ppt/_rels/presentation.xml.rels"}:
                    self.assertEqual(output.read(name), original.read(name), name)

    def test_ir_opt_out_removes_fonts_preserved_by_import_writer_in_both_output_modes(self):
        def preserve_source(_ir, path, **_kwargs):
            Path(path).write_bytes(self.enabled)

        with (
            tempfile.TemporaryDirectory() as directory,
            patch("pptx_pipeline.write_pptx_from_ir", side_effect=preserve_source),
            patch("pptx_pipeline.embed_traditional_slide_fonts") as embed,
        ):
            for path in (None, Path(directory) / "export.pptx"):
                with self.subTest(output_path=path):
                    result = export_ir_to_pptx(self.ir, source_pptx=self.enabled, embed_fonts=False, output_path=path)
                    self.assert_no_fonts(result)
                    if path:
                        self.assertEqual(path.read_bytes(), result)
            embed.assert_not_called()

    def test_ir_opt_out_skips_font_preparation(self):
        with patch("pptx_pipeline.embed_traditional_slide_fonts") as embed:
            result = export_ir_to_pptx(self.ir, embed_fonts=False)
        embed.assert_not_called()
        self.assert_no_fonts(result)


if __name__ == "__main__":
    unittest.main()
