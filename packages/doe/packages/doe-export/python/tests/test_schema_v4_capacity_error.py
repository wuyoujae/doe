from __future__ import annotations

import importlib
import json
import os
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

from test_htmlir_server_security import HtmlIrServerSecurityTests
from doe_export.pptx.schema.layout_error import SchemaLayoutOverflowError
from doe_export.pptx.schema.shared import SchemaV4ExportError

renderer = importlib.import_module("doe_export.pptx.schema._render_schema_deck")
DECK = {"version": 4, "deck": {"theme": "yrkie-theme", "slides": [{"id": "one"}]}}
CODE = "doe_export_layout_overflow"


class CapacityRendererTests(unittest.TestCase):
    def render(self, output, stderr=b"private internal stack", returncode=1):
        with patch.object(renderer.subprocess, "run", return_value=subprocess.CompletedProcess([], returncode, output, stderr)):
            return renderer._render_schema_deck(DECK, {}, timeout_seconds=30, include_screenshots=False, include_stylesheet=False)

    def test_typed_failure_preserves_page_and_fixed_message_without_stderr(self):
        body = {"success": False, "error": {"code": CODE, "page": 1, "message": "private"}}
        with self.assertRaises(SchemaLayoutOverflowError) as caught:
            self.render(json.dumps(body).encode())
        self.assertEqual(caught.exception.code, CODE)
        self.assertEqual(caught.exception.page, 1)
        self.assertEqual(str(caught.exception), "The slide content exceeds the available space.")

    def test_invalid_or_untyped_errors_remain_generic(self):
        bodies = [b"not JSON", b"\xff", b"{}", b"[]"]
        for page in [0, 2, True, "1", 1.2, None]:
            bodies.append(json.dumps({"success": False, "error": {"code": CODE, "page": page}}).encode())
        bodies += [json.dumps({"success": True, "error": {"code": CODE, "page": 1}}).encode(),
                   json.dumps({"success": False, "error": {"code": "other", "page": 1}}).encode(),
                   json.dumps({"success": False, "error": {"code": CODE, "page": 1}}).encode() + b" " * 4096]
        for body in bodies:
            with self.subTest(body=body[:100]), self.assertRaises(SchemaV4ExportError) as caught:
                self.render(body)
            self.assertNotIsInstance(caught.exception, SchemaLayoutOverflowError)
        with self.assertRaises(SchemaV4ExportError) as caught:
            self.render(json.dumps({"success": False, "error": {"code": CODE, "page": 1}}).encode(), returncode=0)
        self.assertNotIsInstance(caught.exception, SchemaLayoutOverflowError)

    @unittest.skipUnless(os.environ.get("YRKIE_DOE_LAYOUT_ERROR_BROWSER_TEST") == "1", "Explicit ordinary export integration; requires matching candidate public")
    def test_real_legal_capacity_page_rejects_both_formats_and_fitting_page_succeeds(self):
        from schema_v4_export import export_schema_v4_deck_to_pptx
        from doe_export.pipeline.pdf.export_schema_v4_deck_to_pdf import export_schema_v4_deck_to_pdf
        fixture = Path(__file__).with_name("capacity_fixture.mjs")
        decks = json.loads(subprocess.check_output(["node", str(fixture)], encoding="utf-8"))
        before = json.dumps(decks, sort_keys=True)
        for kind, export in (("pdf", export_schema_v4_deck_to_pdf), ("pptx", export_schema_v4_deck_to_pptx)):
            with self.subTest(kind=kind):
                with self.assertRaises(SchemaLayoutOverflowError) as caught:
                    export(decks["overflow"], assets={}, timeout_seconds=180)
                self.assertEqual(caught.exception.code, CODE)
                self.assertEqual(caught.exception.page, 1)
                self.assertNotIn("private", str(caught.exception))
                data = export(decks["fitting"], assets={}, timeout_seconds=180)
                self.assertTrue(data.startswith(b"%PDF-" if kind == "pdf" else b"PK"))
        self.assertEqual(json.dumps(decks, sort_keys=True), before)

    def test_timeout_is_not_capacity(self):
        with patch.object(renderer.subprocess, "run", side_effect=subprocess.TimeoutExpired("node", 30)):
            with self.assertRaises(SchemaV4ExportError) as caught:
                renderer._render_schema_deck(DECK, {}, timeout_seconds=30, include_screenshots=False, include_stylesheet=False)
        self.assertNotIsInstance(caught.exception, SchemaLayoutOverflowError)


class CapacityHttpTests(HtmlIrServerSecurityTests):
    def test_both_formats_keep_typed_failure_and_never_classify_untyped_message(self):
        for kind in ("pdf", "pptx"):
            handler = importlib.import_module(f"doe_export.service.http.handler.{kind}._handle_schema_v4_export_{kind}")
            for error in (SchemaLayoutOverflowError(1), SchemaV4ExportError(CODE)):
                with self.subTest(kind=kind, error=type(error).__name__), patch.object(handler, f"export_schema_v4_deck_to_{kind}", side_effect=error):
                    status, _, data = self.request("POST", f"/api/schema-v4/export-{kind}", body=json.dumps({"deck": DECK}).encode(), headers={"Content-Type": "application/json"})
                self.assertEqual(status, 400)
                result = json.loads(data)
                if isinstance(error, SchemaLayoutOverflowError):
                    self.assertEqual(result, {"success": False, "code": CODE, "page": 1, "error": "The slide content exceeds the available space."})
                else:
                    self.assertNotIn("code", result)


def load_tests(loader, tests, pattern):
    suite = loader.loadTestsFromTestCase(CapacityRendererTests)
    suite.addTest(CapacityHttpTests("test_both_formats_keep_typed_failure_and_never_classify_untyped_message"))
    return suite
