from __future__ import annotations

import base64
import dataclasses
import hashlib
import io
import json
import re
import sys
import unittest
import zipfile
from pathlib import Path


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx_pipeline import (  # noqa: E402
    COPYIST_PARSER_VERSION,
    _externalize_canonical_assets,
    _validate_pptx_package,
    render_ir_to_canonical,
)
from pptx2html.htmlir.compiler import (  # noqa: E402
    _unchanged_canonical_presentation,
    compile_html,
)
from pptx2html.ir.model import Bounds, ImageInfo, Presentation, Shape, Slide  # noqa: E402


class PptxImportContractTests(unittest.TestCase):
    def test_copyist_parser_version_invalidates_previous_import_caches(self) -> None:
        self.assertEqual(COPYIST_PARSER_VERSION, "pptx2html-canonical-v4")

    def test_externalizes_visible_and_ir_payload_base64_once(self) -> None:
        raw = b"pptx-image-bytes"
        encoded = base64.b64encode(raw).decode("ascii")
        source = (
            f'<img src="data:image/png;base64,{encoded}">'
            f'<script data-pptx2html-ir="1">{{"data":"{encoded}"}}</script>'
        )
        assets: dict[str, dict] = {}

        result = _externalize_canonical_assets(source, assets)

        self.assertNotIn(encoded, result)
        self.assertIn("yrkie-asset-data://", result)
        self.assertIn("yrkie-asset-base64://", result)
        self.assertEqual(len(assets), 1)
        asset = next(iter(assets.values()))
        self.assertEqual(asset["content_type"], "image/png")
        self.assertEqual(base64.b64decode(asset["data_base64"]), raw)

    def test_externalizes_known_asset_without_returning_duplicate_payload(self) -> None:
        raw = b"existing-image"
        encoded = base64.b64encode(raw).decode("ascii")
        digest = hashlib.sha256(raw).hexdigest()
        source = f'<img src="data:image/png;base64,{encoded}"><script>{{"data":"{encoded}"}}</script>'
        assets: dict[str, dict] = {}

        result = _externalize_canonical_assets(source, assets, known_asset_ids={digest})

        self.assertIn(f"yrkie-asset-data://{digest}", result)
        self.assertIn(f"yrkie-asset-base64://{digest}", result)
        self.assertEqual(assets, {})

    def test_image_canonical_round_trip_restores_externalized_ir_losslessly(self) -> None:
        raw = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF"
            "gAJ/lzQJLwAAAABJRU5ErkJggg=="
        )
        encoded = base64.b64encode(raw).decode("ascii")
        digest = hashlib.sha256(raw).hexdigest()
        presentation = Presentation(
            width=960.0,
            height=540.0,
            slides=[
                Slide(
                    index=0,
                    name="Image slide",
                    shapes=[
                        Shape(
                            type="picture",
                            name="Cropped photo",
                            shape_id=7,
                            bounds=Bounds(24.0, 36.0, 480.0, 270.0),
                            image=ImageInfo(
                                content_type="image/png",
                                data=encoded,
                                crop_left=0.125,
                                crop_right=0.25,
                                crop_top=0.05,
                                crop_bottom=0.15,
                                alpha=0.8,
                            ),
                        )
                    ],
                )
            ],
        )

        rendered = render_ir_to_canonical(dataclasses.asdict(presentation))

        self.assertNotIn(encoded, rendered["html"])
        self.assertIn(f"yrkie-asset-data://{digest}", rendered["html"])
        self.assertIn(f"yrkie-asset-base64://{digest}", rendered["html"])
        payload_match = re.search(
            r'<script\b[^>]*\bid="pptx2html-canonical-ir"[^>]*>(.*?)</script\s*>',
            rendered["html"],
            re.DOTALL,
        )
        self.assertIsNotNone(payload_match)
        payload = json.loads(payload_match.group(1))
        fragment_match = re.search(
            r'<!--\s*PPTX2HTML_SLIDE_START:0\s*-->.*?'
            r'<!--\s*PPTX2HTML_SLIDE_END:0\s*-->',
            rendered["html"],
            re.DOTALL,
        )
        self.assertIsNotNone(fragment_match)
        self.assertEqual(
            payload["slide_hashes"],
            [hashlib.sha256(fragment_match.group(0).encode("utf-8")).hexdigest()],
        )

        compiled = compile_html(rendered["html"], include_ast=True)

        expected = dataclasses.asdict(presentation)
        expected["slides"][0]["shapes"][0]["image"]["data"] = (
            f"yrkie-asset-base64://{digest}"
        )
        self.assertEqual(compiled["presentation"], expected)
        self.assertEqual(compiled["ast"]["kind"], "htmlir-canonical-lossless")
        self.assertEqual(compiled["diagnostics"][0]["code"], "canonical-html-lossless")

        modified = rendered["html"].replace(
            'data-slide-name="Image slide"',
            'data-slide-name="Edited image slide"',
            1,
        )
        self.assertIsNone(_unchanged_canonical_presentation(modified))

    def test_original_and_preview_images_are_externalized_as_separate_assets(self) -> None:
        original = b"lossless-original-picture-bytes"
        preview = b"compressed-browser-preview"
        presentation = Presentation(
            width=960.0,
            height=540.0,
            slides=[
                Slide(
                    index=0,
                    shapes=[
                        Shape(
                            type="picture",
                            bounds=Bounds(0, 0, 960, 540),
                            image=ImageInfo(
                                content_type="image/png",
                                data=base64.b64encode(original).decode("ascii"),
                                preview_content_type="image/webp",
                                preview_data=base64.b64encode(preview).decode("ascii"),
                            ),
                        )
                    ],
                )
            ],
        )

        rendered = render_ir_to_canonical(dataclasses.asdict(presentation))
        original_id = hashlib.sha256(original).hexdigest()
        preview_id = hashlib.sha256(preview).hexdigest()

        self.assertEqual(
            {asset["asset_id"] for asset in rendered["assets"]},
            {original_id, preview_id},
        )
        self.assertNotIn(base64.b64encode(original).decode("ascii"), rendered["html"])
        self.assertNotIn(base64.b64encode(preview).decode("ascii"), rendered["html"])
        self.assertIn(f"yrkie-asset-base64://{original_id}", rendered["html"])
        self.assertIn(f"yrkie-asset-base64://{preview_id}", rendered["html"])
        self.assertIn(f"yrkie-asset-data://{preview_id}", rendered["html"])

    def test_rejects_unsafe_zip_entry(self) -> None:
        stream = io.BytesIO()
        with zipfile.ZipFile(stream, "w") as package:
            package.writestr("ppt/presentation.xml", "<p:presentation/>")
            package.writestr("../escape.bin", b"unsafe")

        with self.assertRaisesRegex(ValueError, "unsafe entry path"):
            _validate_pptx_package(stream.getvalue())


if __name__ == "__main__":
    unittest.main()
