from __future__ import annotations

import base64
import io
import re
import sys
import unittest
import zipfile
from pathlib import Path
from urllib.parse import unquote

from PIL import Image


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx_pipeline import export_ir_to_png_zip  # noqa: E402
from pptx2html.ir.serde import presentation_from_dict  # noqa: E402
from pptx2html.renderer.canonical_html_renderer import CanonicalHtmlRenderer  # noqa: E402


def image_literal() -> dict:
    output = io.BytesIO()
    Image.new("RGB", (8, 8), (220, 40, 20)).save(output, format="PNG")
    return {
        "content_type": "image/png",
        "data": base64.b64encode(output.getvalue()).decode("ascii"),
        "effects": [{"type": "grayscale"}],
    }


def grayscale_presentation() -> dict:
    def full_slide_shape(shape_type: str) -> dict:
        shape = {
            "type": shape_type,
            "name": f"{shape_type} grayscale",
            "bounds": {"left": 0, "top": 0, "width": 960, "height": 540},
        }
        if shape_type == "picture":
            shape["image"] = image_literal()
        else:
            shape["fill"] = {"type": "picture", "image": image_literal()}
        return shape

    return {
        "width": 960,
        "height": 540,
        "slides": [
            {"index": 0, "shapes": [full_slide_shape("picture")]},
            {"index": 1, "shapes": [full_slide_shape("auto_shape")]},
            {
                "index": 2,
                "shapes": [
                    {
                        "type": "graphic_frame",
                        "name": "Table grayscale",
                        "bounds": {"left": 0, "top": 0, "width": 960, "height": 540},
                        "table": {
                            "rows": [[{"fill": {"type": "picture", "image": image_literal()}}]],
                            "col_widths": [960],
                            "row_heights": [540],
                        },
                    }
                ],
            },
            {
                "index": 3,
                "background": {"fill": {"type": "picture", "image": image_literal()}},
                "shapes": [],
            },
        ],
    }


class StaticImageEffectTests(unittest.TestCase):
    def test_grayscale_compact_literal_filters_only_image_elements(self) -> None:
        source = CanonicalHtmlRenderer().render(
            presentation_from_dict(grayscale_presentation())
        )

        picture = re.search(
            r'<div class="pptx-shape pptx-picture"[^>]*>.*?'
            r'<img [^>]*style="([^"]+)"',
            source,
            re.DOTALL,
        )
        self.assertIsNotNone(picture)
        self.assertIn("filter:grayscale(100.000000%)", picture.group(1))

        composed_sources = re.findall(
            r"background-image:url\(&#x27;(data:image/svg\+xml,[^&]+)&#x27;\)",
            source,
        )
        self.assertEqual(len(composed_sources), 3)
        for composed_source in composed_sources:
            svg = unquote(composed_source.split(",", 1)[1])
            self.assertIn('<image ', svg)
            self.assertIn('style="filter:grayscale(100.000000%)"', svg)
            self.assertNotIn('<rect style="filter:', svg)

    def test_grayscale_renders_for_picture_shape_table_and_background(self) -> None:
        payload = export_ir_to_png_zip(grayscale_presentation())

        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            for index in range(1, 5):
                with self.subTest(slide=index):
                    slide = Image.open(
                        io.BytesIO(archive.read(f"slide-{index:03d}.png"))
                    ).convert("RGB")
                    red, green, blue = slide.getpixel((960, 540))
                    self.assertLessEqual(max(red, green, blue) - min(red, green, blue), 3)
                    self.assertGreater(red, 40)
                    self.assertLess(red, 220)


if __name__ == "__main__":
    unittest.main()
