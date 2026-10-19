from __future__ import annotations

import base64
import copy
import importlib
import unittest
from unittest.mock import patch

from test_htmlir_server_security import HtmlIrServerSecurityTests

pipeline = importlib.import_module("doe_export.pipeline.pdf.export_schema_v4_deck_to_pdf")
handler = importlib.import_module("doe_export.service.http.handler.pdf._handle_schema_v4_export_pdf")
DECK = {"version": 4, "deck": {"theme": "yrkie-theme", "slides": [{"id": "one"}]}}
PDF = b"%PDF-1.7\nbody\n%%EOF\n"


class SchemaPdfPipelineTests(unittest.TestCase):
    def test_rejects_invalid_page_count_size_and_watermark_before_rendering(self):
        cases = [(DECK, "false"), ({"version": 3, "deck": DECK["deck"]}, False)]
        for slides in ([], [{}] * 301, [{"size": {"width": 100, "height": 540, "unit": "pt"}}]):
            deck = copy.deepcopy(DECK)
            deck["deck"]["slides"] = slides
            cases.append((deck, False))
        with patch.object(pipeline, "_render_schema_deck") as render:
            for deck, watermark in cases:
                with self.subTest(deck=deck, watermark=watermark), self.assertRaises(ValueError):
                    pipeline.export_schema_v4_deck_to_pdf(deck, export_watermark=watermark)
            render.assert_not_called()

    def test_validates_renderer_contract_completeness_and_file_signature(self):
        valid = {"pdf_contract": pipeline.PDF_CONTRACT, "slide_count": 1, "pdf_base64": base64.b64encode(PDF).decode()}
        for patch_value in ({"pdf_contract": "old"}, {"slide_count": 2}, {"pdf_base64": "%%%"},
                            {"pdf_base64": base64.b64encode(b"%PDF-1.7 truncated").decode()}):
            with self.subTest(patch_value=patch_value), patch.object(pipeline, "_render_schema_deck", return_value={**valid, **patch_value}):
                with self.assertRaises(ValueError):
                    pipeline.export_schema_v4_deck_to_pdf(DECK)
        with patch.object(pipeline, "_render_schema_deck", return_value=valid) as render:
            for marked in (True, False):
                self.assertEqual(pipeline.export_schema_v4_deck_to_pdf(DECK, export_watermark=marked), PDF)
                self.assertEqual(bool(render.call_args.kwargs["watermark_data_uri"]), marked)

    @unittest.skipUnless(__import__("os").environ.get("YRKIE_DOE_FULL_PDF_TEST") == "1", "Explicit full browser/PDF regression; requires PyMuPDF")
    def test_all_main_components_keep_page_geometry_text_and_watermark_separate(self):
        import json
        import subprocess
        from pathlib import Path
        import fitz
        runtime = Path(__file__).resolve().parents[1]
        fixtures = json.loads(subprocess.check_output(["node", str(runtime / "tests/doe_component_fixtures.mjs")], encoding="utf-8"))
        from test_doe_component_export_coverage import component_types
        self.assertFalse(set(fixtures["types"]) - set(component_types(fixtures["scenes"])))
        slides = []
        for index, scene in enumerate(fixtures["scenes"]):
            slide = copy.deepcopy(scene["schema"]["slide"])
            slide["id"] = f"pdf-component-{index}"
            slides.append(slide)
        deck = {"version": 4, "deck": {"theme": "yrkie-theme", "slides": slides}}
        clean = fitz.open(stream=pipeline.export_schema_v4_deck_to_pdf(deck), filetype="pdf")
        marked = fitz.open(stream=pipeline.export_schema_v4_deck_to_pdf(deck, export_watermark=True), filetype="pdf")
        self.assertEqual(len(clean), len(slides))
        self.assertEqual(len(marked), len(slides))
        for index in range(len(slides)):
            with self.subTest(scene=fixtures["scenes"][index]["id"]):
                self.assertEqual(tuple(clean[index].rect), (0, 0, 960, 540))
                self.assertEqual(clean[index].get_text(), marked[index].get_text())
                self.assertTrue(clean[index].get_text().strip())
                self.assertTrue(clean[index].get_fonts())
                self.assertNotEqual(clean[index].get_pixmap().samples, marked[index].get_pixmap().samples)
        self.assertIn("六周", clean[1].get_text())


class SchemaPdfHttpTests(HtmlIrServerSecurityTests):
    # Inherit the existing real HTTP server harness; test discovery runs only
    # the new PDF cases here, leaving the parent's security suite independent.
    def test_pdf_requires_authentication_and_a_strict_watermark_boolean(self):
        import json
        body = lambda value: json.dumps({"deck": DECK, "watermark": value}).encode()
        with patch.object(handler, "export_schema_v4_deck_to_pdf", return_value=PDF) as export:
            status, _, _ = self.request("POST", "/api/schema-v4/export-pdf", token=None,
                                        body=body(False), headers={"Content-Type": "application/json"})
            self.assertEqual(status, 401)
            export.assert_not_called()
            for value in ("false", 1, None, {}):
                status, _, _ = self.request("POST", "/api/schema-v4/export-pdf", body=body(value), headers={"Content-Type": "application/json"})
                self.assertEqual(status, 400)
                export.assert_not_called()
            for marked in (False, True):
                status, headers, data = self.request("POST", "/api/schema-v4/export-pdf", body=body(marked), headers={"Content-Type": "application/json"})
                self.assertEqual(status, 200)
                self.assertEqual(headers["content-type"], "application/pdf")
                self.assertIn("yrkie-pdf.pdf", headers["content-disposition"])
                self.assertEqual(data, PDF)
                self.assertEqual(export.call_args.kwargs["export_watermark"], marked)


def load_tests(loader, tests, pattern):
    suite = loader.loadTestsFromTestCase(SchemaPdfPipelineTests)
    suite.addTest(SchemaPdfHttpTests("test_pdf_requires_authentication_and_a_strict_watermark_boolean"))
    return suite
