from __future__ import annotations

import base64
import io
import sys
import unittest
import zipfile
from pathlib import Path
from unittest.mock import MagicMock
from modular_patch import patch

from PIL import Image


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.ooxml.safe_xml import parse_xml  # noqa: E402
from pptx2html.opc.archive_guard import validate_pptx_archive  # noqa: E402
from pptx2html.ir.builder import PresentationBuilder  # noqa: E402
from pptx2html.server.image_payload import image_payload  # noqa: E402
from pptx2html.htmlir import HtmlCompileError, compile_html, warm_browser_snapshot_worker  # noqa: E402


def minimal_pptx_archive() -> io.BytesIO:
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "[Content_Types].xml",
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
        )
        archive.writestr(
            "ppt/presentation.xml",
            '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>',
        )
    stream.seek(0)
    return stream


class XmlAndArchiveSecurityTests(unittest.TestCase):
    def test_xml_dtd_and_entity_are_rejected(self) -> None:
        source = b'<!DOCTYPE root [<!ENTITY x "expanded">]><root>&x;</root>'

        with self.assertRaises(Exception):
            parse_xml(source)

    def test_xml_depth_budget_is_enforced(self) -> None:
        source = "<root>" + "<node>" * 10 + "x" + "</node>" * 10 + "</root>"

        with self.assertRaisesRegex(ValueError, "depth"):
            parse_xml(source, max_depth=5)

    def test_archive_compression_ratio_budget_is_enforced(self) -> None:
        stream = minimal_pptx_archive()
        with zipfile.ZipFile(stream, "a", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("ppt/media/bomb.bin", b"0" * (2 * 1024 * 1024))
        stream.seek(0)

        with zipfile.ZipFile(stream, "r") as archive:
            with self.assertRaisesRegex(ValueError, "compression-ratio"):
                validate_pptx_archive(archive)


class ImagePayloadSecurityTests(unittest.TestCase):
    def test_file_and_network_urls_are_rejected(self) -> None:
        for url in ("file:///etc/passwd", "http://127.0.0.1/private", "https://example.com/a.png"):
            with self.subTest(url=url), self.assertRaisesRegex(ValueError, "forbidden"):
                image_payload({"url": url, "content_type": "image/png"})

    def test_encoded_size_limit_is_checked_before_decoding(self) -> None:
        with patch("pptx2html.server.image_payload.MAX_IMAGE_ENCODED_BYTES", 8):
            with self.assertRaisesRegex(ValueError, "encoded size"):
                image_payload({"data": "A" * 16, "content_type": "image/png"})

    def test_decoded_pixel_budget_is_enforced(self) -> None:
        stream = io.BytesIO()
        Image.new("RGB", (2, 2), "red").save(stream, format="PNG")
        encoded = base64.b64encode(stream.getvalue()).decode("ascii")

        with patch("pptx2html.server.image_payload.MAX_IMAGE_PIXELS", 1):
            with self.assertRaisesRegex(ValueError, "decoded pixels"):
                image_payload({"data": encoded, "content_type": "image/png"})

    def test_active_svg_is_rejected(self) -> None:
        source = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        encoded = base64.b64encode(source).decode("ascii")

        for content_type in ("image/svg+xml", "application/octet-stream"):
            with self.subTest(content_type=content_type), self.assertRaisesRegex(ValueError, "script"):
                image_payload({"data": encoded, "content_type": content_type})


class PreviewImageSecurityTests(unittest.TestCase):
    def test_preview_generation_rejects_oversized_pixel_dimensions_before_decode(self) -> None:
        source = MagicMock()
        source.__enter__.return_value = source
        source.__exit__.return_value = False
        source.n_frames = 1
        source.size = (50_000, 50_000)

        with (
            patch("pptx2html.ir.builder.Image.open", return_value=source),
            patch("pptx2html.ir.builder.ImageOps.exif_transpose") as transpose,
        ):
            result = PresentationBuilder._compressed_preview_image_blob(
                "image/png",
                b"valid-header-placeholder",
            )

        self.assertEqual(result, (None, None))
        transpose.assert_not_called()


class BrowserActiveContentSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        try:
            warm_browser_snapshot_worker()
        except Exception as error:  # pragma: no cover - depends on local Chromium installation
            raise unittest.SkipTest(f"Chromium runtime is unavailable: {error}") from error

    def test_static_html_still_compiles_with_script_blocking_csp(self) -> None:
        result = compile_html('<div style="width:100px;height:40px">safe</div>')

        self.assertTrue(result["success"])

    def test_active_or_network_html_is_rejected(self) -> None:
        active_svg = base64.b64encode(
            b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        ).decode("ascii")
        cases = {
            "script": '<script>while(true){}</script><div>unsafe</div>',
            "event handler": '<img src="data:image/png;base64,AAAA" onerror="alert(1)">',
            "spoofed head event handler": '<!-- <head> --><img src="missing" onerror="while(true){}">',
            "iframe": '<iframe srcdoc="<p>unsafe</p>"></iframe>',
            "meta refresh": '<meta http-equiv="refresh" content="0;url=http://127.0.0.1">',
            "dangerous URL": '<a href="java\nscript:alert(1)">unsafe</a>',
            "network URL": '<img src="http://127.0.0.1/private.png">',
            "active SVG data URL": f'<img src="data:image/svg+xml;base64,{active_svg}">',
            "unquoted SVG data URL": f'<img src=data:image/svg+xml;base64,{active_svg}>',
            "CSS SVG data URL": (
                f'<div style="background-image:url(data:image/svg+xml;base64,{active_svg})"></div>'
            ),
        }
        for label, source in cases.items():
            with self.subTest(label=label):
                with self.assertRaises(HtmlCompileError) as raised:
                    compile_html(source, timeout_ms=5_000)
                self.assertTrue(
                    any("Unsafe HTML" in item.message for item in raised.exception.diagnostics),
                    raised.exception.diagnostics,
                )

    def test_static_svg_data_url_is_allowed(self) -> None:
        source = (
            b'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">'
            b'<rect width="20" height="20" fill="#123456"/></svg>'
        )
        encoded = base64.b64encode(source).decode("ascii")

        result = compile_html(
            f'<div style="width:100px;height:100px">'
            f'<img src="data:image/svg+xml;base64,{encoded}" '
            f'style="width:20px;height:20px"></div>',
            timeout_ms=5_000,
        )

        self.assertTrue(result["success"])


if __name__ == "__main__":
    unittest.main()
