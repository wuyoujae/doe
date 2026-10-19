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
from pptx2html.ir.model import (  # noqa: E402
    Bounds,
    ImageInfo,
    Presentation,
    Shadow,
    Shape,
    Slide,
)
from pptx2html.renderer.canonical_html_renderer import CanonicalHtmlRenderer  # noqa: E402


def asymmetric_png() -> tuple[str, str]:
    image = Image.new("RGB", (200, 100))
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            if x < image.width // 2 and y < image.height // 2:
                pixels[x, y] = (232, 32, 40)
            elif y < image.height // 2:
                pixels[x, y] = (24, 172, 72)
            elif x < image.width // 2:
                pixels[x, y] = (32, 88, 224)
            else:
                pixels[x, y] = (244, 196, 32)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", dpi=(96, 96))
    raw = base64.b64encode(buffer.getvalue()).decode("ascii")
    return raw, f"data:image/png;base64,{raw}"


def solid_png_data_url(color: tuple[int, int, int]) -> str:
    buffer = io.BytesIO()
    Image.new("RGB", (8, 8), color).save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def image_dict(raw: str, **geometry) -> dict:
    return {
        "content_type": "image/png",
        "data": raw,
        **geometry,
    }


def full_slide_shape(shape_type: str, image: dict) -> dict:
    shape = {
        "type": shape_type,
        "name": f"{shape_type} image",
        "bounds": {"left": 0, "top": 0, "width": 960, "height": 540},
    }
    if shape_type == "picture":
        shape["image"] = image
    else:
        shape["fill"] = {"type": "picture", "image": image}
    return shape


class StaticImageGeometryTests(unittest.TestCase):
    def test_managed_asset_composite_keeps_opacity_crop_and_flip_visible_to_expansion(self) -> None:
        asset_id = "a" * 64
        picture_fill = {
            "type": "picture",
            "image": {
                "content_type": "image/png",
                "data": f"yrkie-asset-base64://{asset_id}",
                "alpha": 0.4,
                "tile": True,
                "tile_flip": "xy",
                "crop_left": 0.25,
            },
        }
        # Use the public dict loader so the test exercises the same compact IR
        # shape accepted by editor persistence.
        from pptx2html.ir.serde import presentation_from_dict

        presentation = presentation_from_dict(
            {
                "width": 960,
                "height": 540,
                "slides": [
                    {
                        "index": 0,
                        "shapes": [
                            {
                                "type": "auto_shape",
                                "name": "Managed tiled fill",
                                "bounds": {"left": 0, "top": 0, "width": 320, "height": 180},
                                "fill": picture_fill,
                            }
                        ],
                    }
                ],
            }
        )
        source = CanonicalHtmlRenderer().render(presentation)

        style_match = re.search(
            r'background-image:url\(&#x27;(data:image/svg\+xml,[^&]+)&#x27;\)', source
        )
        self.assertIsNotNone(style_match)
        composed_svg = unquote(style_match.group(1).split(",", 1)[1])
        self.assertIn(f'yrkie-asset-data://{asset_id}', composed_svg)
        self.assertIn('opacity="0.400000"', composed_svg)
        self.assertIn('scale(-1 -1)', composed_svg)
        self.assertIn('x="-33.33333333"', composed_svg)

    def test_picture_uses_data_before_url_and_clips_inside_the_shadowed_shape(self) -> None:
        raw, data_url = asymmetric_png()
        stale_url = solid_png_data_url((135, 20, 220))
        picture = Shape(
            type="picture",
            name="Cropped picture",
            bounds=Bounds(20, 30, 300, 180),
            shadow=Shadow(blur_pt=8, offset_x=6, offset_y=4, color="000000", alpha=0.4),
            image=ImageInfo(
                content_type="image/png",
                data=raw,
                url=stale_url,
                crop_left=0.5,
                stretch_left=0.25,
                stretch_right=0.25,
            ),
        )
        source = CanonicalHtmlRenderer().render(
            Presentation(width=960, height=540, slides=[Slide(index=0, shapes=[picture])])
        )

        picture_opening = re.search(r'<div class="pptx-shape pptx-picture"[^>]*>', source)
        self.assertIsNotNone(picture_opening)
        self.assertIn("drop-shadow", picture_opening.group(0))
        self.assertNotIn("overflow:hidden", picture_opening.group(0))
        self.assertIn('<div class="pptx-image-clip">', source)
        image_tag = re.search(r'<img src="([^"]+)" style="([^"]+)" alt="Cropped picture">', source)
        self.assertIsNotNone(image_tag)
        self.assertEqual(image_tag.group(1), data_url)
        self.assertIn("left:-25.000000%", image_tag.group(2))
        self.assertIn("width:100.000000%", image_tag.group(2))

    def test_picture_shape_fill_and_slide_background_share_crop_geometry_in_png_export(self) -> None:
        raw, _ = asymmetric_png()
        cropped = image_dict(raw, crop_left=0.5)
        stretched = image_dict(
            raw,
            stretch_left=0.25,
            stretch_right=0.25,
            stretch_top=0.25,
            stretch_bottom=0.25,
        )
        tiled = image_dict(
            raw,
            tile=True,
            tile_scale_x=1.0,
            tile_scale_y=1.0,
            tile_align="tl",
        )
        faded = image_dict(raw, alpha=0.5)
        presentation = {
            "width": 960,
            "height": 540,
            "slides": [
                {"index": 0, "shapes": [full_slide_shape("picture", cropped)]},
                {"index": 1, "shapes": [full_slide_shape("auto_shape", cropped)]},
                {
                    "index": 2,
                    "background": {"fill": {"type": "picture", "image": cropped}},
                    "shapes": [],
                },
                {
                    "index": 3,
                    "background": {"fill": {"type": "picture", "image": stretched}},
                    "shapes": [],
                },
                {
                    "index": 4,
                    "background": {"fill": {"type": "picture", "image": tiled}},
                    "shapes": [],
                },
                {
                    "index": 5,
                    "shapes": [
                        {
                            "type": "graphic_frame",
                            "name": "Picture-filled table cell",
                            "bounds": {"left": 0, "top": 0, "width": 960, "height": 540},
                            "table": {
                                "rows": [[{"fill": {"type": "picture", "image": cropped}}]],
                                "col_widths": [960],
                                "row_heights": [540],
                            },
                        }
                    ],
                },
                {
                    "index": 6,
                    "background": {"fill": {"type": "picture", "image": faded}},
                    "shapes": [],
                },
            ],
        }

        payload = export_ir_to_png_zip(presentation)
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            slides = [Image.open(io.BytesIO(archive.read(f"slide-{index:03d}.png"))).convert("RGB") for index in range(1, 8)]

        for slide in [*slides[:3], slides[5]]:
            self.assertColorClose(slide.getpixel((480, 180)), (24, 172, 72))
            self.assertColorClose(slide.getpixel((480, 900)), (244, 196, 32))

        stretched_slide = slides[3]
        self.assertColorClose(stretched_slide.getpixel((100, 100)), (255, 255, 255))
        self.assertColorClose(stretched_slide.getpixel((1200, 400)), (24, 172, 72))
        self.assertColorClose(stretched_slide.getpixel((1200, 680)), (244, 196, 32))
        self.assertColorClose(stretched_slide.getpixel((1820, 980)), (255, 255, 255))

        tiled_slide = slides[4]
        self.assertColorClose(tiled_slide.getpixel((20, 20)), (232, 32, 40))
        self.assertColorClose(tiled_slide.getpixel((320, 20)), (232, 32, 40))
        self.assertColorClose(tiled_slide.getpixel((200, 20)), (24, 172, 72))
        self.assertColorClose(tiled_slide.getpixel((20, 120)), (32, 88, 224))

        self.assertColorClose(slides[6].getpixel((100, 100)), (244, 143, 147), tolerance=6)

    def assertColorClose(
        self,
        actual: tuple[int, int, int],
        expected: tuple[int, int, int],
        tolerance: int = 4,
    ) -> None:
        self.assertTrue(
            all(abs(actual[index] - expected[index]) <= tolerance for index in range(3)),
            f"expected {expected}, got {actual}",
        )


if __name__ == "__main__":
    unittest.main()
