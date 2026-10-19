from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from modular_patch import patch

from pptx2html.htmlir import compiler


class _RunningProcess:
    pid = 7319

    @staticmethod
    def poll() -> None:
        return None


class BrowserWorkerLifecycleTests(unittest.TestCase):
    def test_generated_pseudo_content_rejects_the_whole_mixed_slide(self) -> None:
        result = compiler.compile_slide_fragments(
            [
                {
                    "id": "pseudo",
                    "fragment": (
                        '<section class="w-full h-full">'
                        "<style>.badge::before{content:'Before';display:block;"
                        "width:160px;height:40px;color:#111;background:#eee}</style>"
                        '<h1>Supported sibling</h1><div class="badge"></div>'
                        "</section>"
                    ),
                }
            ],
            include_ast=True,
            include_browser_screenshot=False,
            viewport=(1920, 1080),
            timeout_ms=30_000,
            max_dom_nodes=5_000,
            render_mode="semantic",
            concurrency=1,
            require_editable_coverage=True,
        )[0]
        self.assertFalse(result["success"])
        self.assertEqual(result["error_kind"], "content")
        self.assertTrue(
            any(
                item["code"] == "unsupported-pseudo-content"
                for item in result["diagnostics"]
            )
        )

    def test_editable_coverage_rejects_all_non_default_pseudo_content(self) -> None:
        for content in ('"PREFIX"', '""', "counter(item)", 'url("badge.svg")'):
            with self.subTest(content=content):
                with self.assertRaises(compiler.HtmlCompileError) as raised:
                    compiler._require_editable_element_coverage(
                        {
                            "nodes": [
                                {
                                    "nodeType": "element",
                                    "tag": "section",
                                    "visible": True,
                                    "pseudo": {
                                        "before": {
                                            "content": content,
                                            "display": "block",
                                        },
                                        "after": None,
                                    },
                                }
                            ]
                        }
                    )
                self.assertEqual(
                    raised.exception.diagnostics[0].code,
                    "unsupported-pseudo-content",
                )

        compiler._require_editable_element_coverage(
            {
                "nodes": [
                    {
                        "nodeType": "element",
                        "tag": "section",
                        "visible": True,
                        "pseudo": {"before": None, "after": None},
                    }
                ]
            }
        )

    def test_editable_svg_policy_rejects_unmapped_paint_filter_and_transform_features(self) -> None:
        cases = {
            "gradient": (
                '<svg width="200" height="100" viewBox="0 0 200 100">'
                '<defs><linearGradient id="g"><stop offset="0" stop-color="red" />'
                '<stop offset="1" stop-color="blue" /></linearGradient></defs>'
                '<rect width="200" height="100" fill="url(#g)" /></svg>'
            ),
            "filter": (
                '<svg width="200" height="100" viewBox="0 0 200 100">'
                '<defs><filter id="f"><feGaussianBlur stdDeviation="4" /></filter></defs>'
                '<rect width="200" height="100" fill="red" filter="url(#f)" /></svg>'
            ),
            "group-transform": (
                '<svg width="200" height="100" viewBox="0 0 200 100">'
                '<g transform="translate(25 0)"><rect width="100" height="50" fill="red" />'
                "</g></svg>"
            ),
        }
        items = [
            {
                "id": name,
                "fragment": f'<section class="w-full h-full">{svg}</section>',
            }
            for name, svg in cases.items()
        ]
        results = compiler.compile_slide_fragments(
            items,
            include_ast=False,
            include_browser_screenshot=False,
            viewport=(1920, 1080),
            timeout_ms=30_000,
            max_dom_nodes=5_000,
            render_mode="semantic",
            concurrency=1,
            require_editable_coverage=True,
        )
        self.assertEqual(len(results), len(cases))
        for result in results:
            with self.subTest(case=result["id"]):
                self.assertFalse(result["success"])
                self.assertEqual(result["error_kind"], "content")
                self.assertTrue(
                    any(
                        item["code"] in {"unsupported-svg-element", "unsupported-svg-feature"}
                        for item in result["diagnostics"]
                    )
                )

    def test_browser_rejects_unverified_css_image_functions_as_content(self) -> None:
        cases = {
            "network-image-set": 'image-set("https://example.com/a.png" 1x)',
            "data-webkit-image-set": (
                '-webkit-image-set("data:image/png;base64,AAAA" 1x)'
            ),
            "cross-fade": (
                'cross-fade(url("data:image/png;base64,AAAA") 50%, '
                'url("data:image/png;base64,AAAA"))'
            ),
            "escaped-image-set": r'ima\67 e-set("https://example.com/a.png" 1x)',
            "comment-image-set": 'image/**/-set("https://example.com/a.png" 1x)',
            "stylesheet-network-image-set": 'image-set("https://example.com/a.png" 1x)',
        }
        results = compiler.compile_slide_fragments(
            [
                {
                    "id": name,
                    "fragment": (
                        (
                            f"<style>.target{{background-image:{value}}}</style>"
                            '<section class="w-full h-full"><h1>Supported sibling</h1>'
                            "<div class='target'></div></section>"
                        )
                        if name.startswith("stylesheet-")
                        else (
                            '<section class="w-full h-full">'
                            f"<h1>Supported sibling</h1><div style='background-image:{value}'></div>"
                            "</section>"
                        )
                    ),
                }
                for name, value in cases.items()
            ],
            include_ast=False,
            include_browser_screenshot=False,
            viewport=(1920, 1080),
            timeout_ms=30_000,
            max_dom_nodes=5_000,
            render_mode="semantic",
            concurrency=1,
            require_editable_coverage=True,
        )
        for result in results:
            with self.subTest(case=result["id"]):
                self.assertFalse(result["success"])
                self.assertEqual(result["error_kind"], "content")
                self.assertIn("unsupported CSS image function", result["error"])

    def test_browser_batch_rejects_mixed_heading_and_progress_without_partial_success(self) -> None:
        result = compiler.compile_slide_fragments(
            [
                {
                    "id": "mixed",
                    "fragment": (
                        '<section class="w-full h-full">'
                        "<h1>Supported heading</h1>"
                        '<progress value="1" max="2"></progress>'
                        "</section>"
                    ),
                }
            ],
            include_ast=False,
            include_browser_screenshot=False,
            viewport=(1920, 1080),
            timeout_ms=30_000,
            max_dom_nodes=5_000,
            render_mode="semantic",
            concurrency=1,
            require_editable_coverage=True,
        )[0]
        self.assertFalse(result["success"])
        self.assertEqual(result["error_kind"], "content")
        self.assertEqual(result["diagnostics"][0]["code"], "unsupported-visible-element")
        self.assertEqual(result["diagnostics"][0]["tag"], "progress")

    def test_browser_batch_rejects_quote_and_ruby_elements_without_partial_success(self) -> None:
        cases = {
            "quote": "<h1>Supported sibling</h1><q>Quoted text</q>",
            "ruby": (
                "<h1>Supported sibling</h1><ruby>漢<rp>(</rp><rt>kan</rt><rp>)</rp></ruby>"
            ),
            "ruby-text": "<h1>Supported sibling</h1><rt>annotation</rt>",
            "ruby-parenthesis": "<h1>Supported sibling</h1><rp>(</rp>",
        }
        results = compiler.compile_slide_fragments(
            [
                {
                    "id": name,
                    "fragment": f'<section class="w-full h-full">{fragment}</section>',
                }
                for name, fragment in cases.items()
            ],
            include_ast=False,
            include_browser_screenshot=False,
            viewport=(1920, 1080),
            timeout_ms=30_000,
            max_dom_nodes=5_000,
            render_mode="semantic",
            concurrency=1,
            require_editable_coverage=True,
        )
        for result in results:
            with self.subTest(case=result["id"]):
                self.assertFalse(result["success"])
                self.assertEqual(result["error_kind"], "content")
                self.assertTrue(
                    any(
                        item["code"]
                        in {"unsupported-visible-element", "unsupported-pseudo-content"}
                        for item in result["diagnostics"]
                    )
                )

    def test_browser_batch_rejects_text_pseudo_styles_and_summary(self) -> None:
        cases = {
            "first-letter": (
                "<style>.target::first-letter{color:#ef4444;font-size:48px}</style>"
                "<h1>Supported sibling</h1><p class='target'>Styled first letter</p>"
            ),
            "first-line": (
                "<style>.target::first-line{font-weight:700;text-decoration:underline}</style>"
                "<h1>Supported sibling</h1><p class='target'>Styled first line</p>"
            ),
            "summary": "<h1>Supported sibling</h1><summary>Disclosure label</summary>",
        }
        results = compiler.compile_slide_fragments(
            [
                {
                    "id": name,
                    "fragment": f'<section class="w-full h-full">{fragment}</section>',
                }
                for name, fragment in cases.items()
            ],
            include_ast=False,
            include_browser_screenshot=False,
            viewport=(1920, 1080),
            timeout_ms=30_000,
            max_dom_nodes=5_000,
            render_mode="semantic",
            concurrency=1,
            require_editable_coverage=True,
        )
        for result in results:
            with self.subTest(case=result["id"]):
                self.assertFalse(result["success"])
                self.assertEqual(result["error_kind"], "content")
                expected = (
                    "unsupported-visible-element"
                    if result["id"] == "summary"
                    else "unsupported-text-pseudo-style"
                )
                self.assertTrue(
                    any(item["code"] == expected for item in result["diagnostics"])
                )

    def test_editable_coverage_rejects_computed_text_pseudo_differences(self) -> None:
        for pseudo_name in ("firstLetter", "firstLine"):
            with self.subTest(pseudo_name=pseudo_name):
                with self.assertRaises(compiler.HtmlCompileError) as raised:
                    compiler._require_editable_element_coverage(
                        {
                            "nodes": [
                                {
                                    "nodeType": "element",
                                    "tag": "p",
                                    "visible": True,
                                    "pseudo": {
                                        pseudo_name: {
                                            "differences": {"color": "rgb(255, 0, 0)"}
                                        }
                                    },
                                }
                            ]
                        }
                    )
                self.assertEqual(
                    raised.exception.diagnostics[0].code,
                    "unsupported-text-pseudo-style",
                )

    def test_editable_coverage_rejects_visible_unknown_elements_in_mixed_slides(self) -> None:
        base_nodes = [
            {"nodeType": "element", "tag": "section", "visible": True},
            {"nodeType": "element", "tag": "h1", "visible": True},
        ]
        for tag in (
            "progress",
            "meter",
            "canvas",
            "future-widget",
            "q",
            "ruby",
            "rp",
            "rt",
            "summary",
        ):
            with self.subTest(tag=tag):
                with self.assertRaises(compiler.HtmlCompileError) as raised:
                    compiler._require_editable_element_coverage(
                        {
                            "nodes": base_nodes
                            + [{"nodeType": "element", "tag": tag, "visible": True}]
                        }
                    )
                self.assertEqual(
                    raised.exception.diagnostics[0].code,
                    "unsupported-visible-element",
                )
                self.assertEqual(raised.exception.diagnostics[0].tag, tag)

        compiler._require_editable_element_coverage({"nodes": base_nodes})

    def test_strict_browser_environment_does_not_inherit_runtime_secrets(self) -> None:
        with patch.dict(
            os.environ,
            {
                "PATH": os.defpath,
                "YRKIE_HTMLIR_SANITIZE_BROWSER_ENV": "true",
                "YRKIE_HTMLIR_CHROMIUM_SANDBOX_REQUIRED": "true",
                "LD_LIBRARY_PATH": "/tmp/untrusted-runtime-libraries",
                "NODE_PATH": "/tmp/untrusted-node-modules",
                "PLAYWRIGHT_CHROMIUM_EXECUTABLE": "/tmp/untrusted-chrome",
                "YRKIE_HTMLIR_PLAYWRIGHT_PACKAGE_JSON": "/tmp/untrusted-package.json",
                "YRKIE_DATABASE_URL": "must-not-reach-node",
            },
            clear=True,
        ):
            environment = compiler._browser_worker_environment()
        self.assertIsNotNone(environment)
        self.assertEqual(environment["YRKIE_HTMLIR_CHROMIUM_SANDBOX_REQUIRED"], "true")
        self.assertNotIn("LD_LIBRARY_PATH", environment)
        self.assertNotIn("NODE_PATH", environment)
        self.assertNotIn("PLAYWRIGHT_CHROMIUM_EXECUTABLE", environment)
        self.assertNotIn("YRKIE_HTMLIR_PLAYWRIGHT_PACKAGE_JSON", environment)
        self.assertNotIn("YRKIE_DATABASE_URL", environment)

    def test_configured_release_node_never_falls_back_to_host_path(self) -> None:
        if os.name == "posix" and os.geteuid() != 0:
            self.skipTest("The production configured Node contract is root-owned.")
        with tempfile.TemporaryDirectory() as directory:
            node = Path(directory) / "node"
            node.write_bytes(b"signed-node")
            node.chmod(0o755)
            with (
                patch.dict(
                    os.environ,
                    {"YRKIE_HTMLIR_NODE_EXECUTABLE": str(node)},
                    clear=True,
                ),
                patch.object(
                    compiler._BROWSER_SNAPSHOT_WORKER,
                    "invoke",
                    return_value={"success": True},
                ) as invoke,
                patch.object(compiler.shutil, "which") as host_lookup,
            ):
                self.assertEqual(
                    compiler._invoke_browser_snapshot(
                        {"command": "ping"}, timeout_ms=1000
                    ),
                    {"success": True},
                )
            host_lookup.assert_not_called()
            self.assertEqual(invoke.call_args.kwargs["node"], str(node.resolve()))

    def test_worker_recycles_after_bounded_request_count(self) -> None:
        worker = compiler._BrowserSnapshotWorker()
        worker._process = _RunningProcess()
        worker._completed_requests = compiler.BROWSER_WORKER_MAX_REQUESTS

        with patch.object(compiler, "_linux_process_tree_rss_bytes", return_value=0):
            self.assertEqual(worker._recycle_reason(), "request-limit")

    def test_worker_recycles_when_process_tree_crosses_rss_limit(self) -> None:
        worker = compiler._BrowserSnapshotWorker()
        worker._process = _RunningProcess()

        with patch.object(
            compiler,
            "_linux_process_tree_rss_bytes",
            return_value=compiler.BROWSER_WORKER_MAX_RSS_BYTES,
        ):
            self.assertEqual(worker._recycle_reason(), "rss-limit")

    def test_unavailable_process_metrics_do_not_force_recycle(self) -> None:
        worker = compiler._BrowserSnapshotWorker()
        worker._process = _RunningProcess()

        with patch.object(compiler, "_linux_process_tree_rss_bytes", return_value=None):
            self.assertIsNone(worker._recycle_reason())


if __name__ == "__main__":
    unittest.main()
