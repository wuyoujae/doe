from __future__ import annotations

import unittest
from test_paths import DOE_PUBLIC_ROOT
from pptx2html.htmlir.compiler import compile_slide_fragment
from test_traditional_slide_fonts import text_run_fonts
from doe_export.pptx.fonts._collect_traditional_font_usage import _collect_traditional_font_usage
from doe_export.pptx.fonts._prepare_font_face import _prepare_font_face
from doe_export.pptx.fonts.trusted_traditional_slide_fonts import trusted_traditional_slide_fonts


class RegisteredThemeFontTests(unittest.TestCase):
    def test_browser_resolves_only_loaded_display_weight_and_style(self):
        # Each fragment loads one face: a 400-only probe must not replace a 600 face.
        for family, weight, style in [("EB Garamond", 600, "normal"),
                                      ("EB Garamond", 600, "italic"),
                                      ("EB Garamond", 400, "normal"),
                                      ("IBM Plex Mono", 600, "italic")]:
            with self.subTest(family=family, weight=weight, style=style):
                fragment = (
                    '<section class="w-full h-full bg-white p-16">'
                    f'<div style="font-family:\'{family}\',MiSans,serif;'
                    f'font-size:64px;font-weight:{weight};font-style:{style}">'
                    'Shaped by hand</div></section>'
                )
                result = compile_slide_fragment(fragment, timeout_ms=60_000)
                self.assertEqual(text_run_fonts(result["presentation"])["Shaped by hand"], family)

    def test_owned_display_fonts_can_be_subset_and_embedded(self):
        expected = {"EB Garamond": 4, "IBM Plex Mono": 4, "Fredoka": 2, "Caveat": 2}
        faces = trusted_traditional_slide_fonts(DOE_PUBLIC_ROOT.parent)
        for family, count in expected.items():
            selected = [face for face in faces if face.family == family]
            self.assertEqual(len(selected), count, family)
            for face in selected:
                self.assertTrue(face.path.is_file(), str(face.path))
                prepared = _prepare_font_face(face, "Salt Air 2026")
                self.assertEqual(prepared.family, family)
                self.assertGreater(len(prepared.font_part_bytes), 500)
                self.assertEqual(prepared.missing_codepoints, ())

    def test_font_usage_keeps_real_italic_faces_and_synthetic_display_styles(self):
        ir = [{"text": "Salt Air", "font": {"family": family, "bold": True, "italic": True}}
              for family in ["EB Garamond", "IBM Plex Mono", "Fredoka", "Caveat"]]
        self.assertEqual(set(_collect_traditional_font_usage(ir)), {
            ("eb garamond", "boldItalic"), ("ibm plex mono", "boldItalic"),
            ("fredoka", "bold"), ("caveat", "bold"),
        })


if __name__ == "__main__":
    unittest.main()
