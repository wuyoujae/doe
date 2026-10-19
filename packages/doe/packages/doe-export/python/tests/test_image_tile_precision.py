from __future__ import annotations

import base64
import copy
import io
import re
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from urllib.parse import unquote

from PIL import Image as PILImage


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.htmlir.compiler import _image_info_from_src  # noqa: E402
from pptx2html.ir.builder import PresentationBuilder  # noqa: E402
from pptx2html.ir.serde import presentation_from_dict  # noqa: E402
from pptx2html.pom.presentation import Presentation as PomPresentation  # noqa: E402
from pptx2html.renderer.canonical_html_renderer import CanonicalHtmlRenderer  # noqa: E402
from pptx2html.server.pptx_writer import write_pptx_from_ir  # noqa: E402


A = "http://schemas.openxmlformats.org/drawingml/2006/main"
P = "http://schemas.openxmlformats.org/presentationml/2006/main"
EMU_PER_PT = 12700


def png_at_dpi() -> bytes:
    output = io.BytesIO()
    PILImage.new("RGB", (200, 100), (30, 120, 220)).save(
        output,
        format="PNG",
        dpi=(144, 144),
    )
    return output.getvalue()


def image_ir(payload: bytes, **extra) -> dict:
    return {
        "content_type": "image/png",
        "data": base64.b64encode(payload).decode("ascii"),
        **extra,
    }


def presentation_ir(image: dict) -> dict:
    return {
        "width": 960,
        "height": 540,
        "slides": [
            {
                "index": 0,
                "shapes": [
                    {
                        "type": "picture",
                        "shape_id": 2,
                        "name": "Precise tile",
                        "bounds": {"left": 20, "top": 30, "width": 400, "height": 200},
                        "image": image,
                    }
                ],
            }
        ],
    }


def tile_attributes(path: Path) -> dict[str, str]:
    with zipfile.ZipFile(path) as package:
        slide = ET.fromstring(package.read("ppt/slides/slide1.xml"))
    tile = slide.find(f".//{{{P}}}pic/{{{P}}}blipFill/{{{A}}}tile")
    if tile is None:
        raise AssertionError("picture tile was not written")
    return dict(tile.attrib)


def imported_image(path: Path):
    with PomPresentation.open(str(path)) as pom:
        return PresentationBuilder().build(pom).slides[0].shapes[0].image


class ImageTilePrecisionTests(unittest.TestCase):
    def test_non_96_dpi_intrinsic_size_and_signed_tile_offsets_round_trip(self) -> None:
        payload = png_at_dpi()
        with PILImage.open(io.BytesIO(payload)) as source:
            dpi_x, dpi_y = source.info["dpi"]
            expected_width_pt = source.width * 72.0 / dpi_x
            expected_height_pt = source.height * 72.0 / dpi_y

        original_image = image_ir(
            payload,
            tile=True,
            tile_scale_x=1.25,
            tile_scale_y=0.5,
            tile_offset_x_pt=2.0,
            tile_offset_y_pt=-3.0,
            tile_align="br",
            tile_flip="xy",
        )
        original = presentation_ir(original_image)
        desired = copy.deepcopy(original)
        desired_image = desired["slides"][0]["shapes"][0]["image"]
        desired_image["tile_offset_x_pt"] = 12.5
        desired_image["tile_offset_y_pt"] = -7.25

        with tempfile.TemporaryDirectory() as temp_dir:
            direct_path = Path(temp_dir) / "direct.pptx"
            roundtrip_path = Path(temp_dir) / "roundtrip.pptx"
            write_pptx_from_ir(desired, direct_path)
            write_pptx_from_ir(
                desired,
                roundtrip_path,
                source_pptx=write_source_bytes(original, Path(temp_dir)),
                original_ir=original,
            )

            expected_tile = {
                "sx": "125000",
                "sy": "50000",
                "tx": str(round(12.5 * EMU_PER_PT)),
                "ty": str(round(-7.25 * EMU_PER_PT)),
                "algn": "br",
                "flip": "xy",
            }
            for output_path in (direct_path, roundtrip_path):
                with self.subTest(output=output_path.name):
                    self.assertEqual(tile_attributes(output_path), expected_tile)
                    image = imported_image(output_path)
                    self.assertAlmostEqual(image.intrinsic_width_pt, expected_width_pt, places=4)
                    self.assertAlmostEqual(image.intrinsic_height_pt, expected_height_pt, places=4)
                    self.assertAlmostEqual(image.tile_offset_x_pt, 12.5, places=6)
                    self.assertAlmostEqual(image.tile_offset_y_pt, -7.25, places=6)

    def test_static_tiling_uses_ir_intrinsic_size_alignment_and_offsets(self) -> None:
        presentation = presentation_from_dict(
            presentation_ir(
                image_ir(
                    png_at_dpi(),
                    intrinsic_width_pt=100.0,
                    intrinsic_height_pt=50.0,
                    tile=True,
                    tile_scale_x=0.5,
                    tile_scale_y=2.0,
                    tile_offset_x_pt=20.0,
                    tile_offset_y_pt=-10.0,
                    tile_align="br",
                    tile_flip="x",
                )
            )
        )
        source = CanonicalHtmlRenderer().render(presentation)
        match = re.search(r"data:image/svg\+xml,([^&'\"]+)", source)
        self.assertIsNotNone(match)
        svg = unquote(match.group(1))
        pattern = re.search(r'<pattern id="pptx-image-pattern"[^>]+>', svg)
        self.assertIsNotNone(pattern)
        self.assertIn('x="92.50000000"', pattern.group(0))
        self.assertIn('y="45.00000000"', pattern.group(0))
        self.assertIn('width="25.00000000"', pattern.group(0))
        self.assertIn('height="50.00000000"', pattern.group(0))

    def test_htmlir_records_physical_intrinsic_size_when_image_bytes_are_available(self) -> None:
        payload = png_at_dpi()
        image = _image_info_from_src(
            f"data:image/png;base64,{base64.b64encode(payload).decode('ascii')}"
        )
        with PILImage.open(io.BytesIO(payload)) as source:
            dpi_x, dpi_y = source.info["dpi"]
            self.assertAlmostEqual(image.intrinsic_width_pt, source.width * 72.0 / dpi_x, places=4)
            self.assertAlmostEqual(image.intrinsic_height_pt, source.height * 72.0 / dpi_y, places=4)


def write_source_bytes(ir: dict, temp_dir: Path) -> bytes:
    path = temp_dir / "source.pptx"
    write_pptx_from_ir(ir, path)
    return path.read_bytes()


if __name__ == "__main__":
    unittest.main()
