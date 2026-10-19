from __future__ import annotations

import base64
import io
import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from types import SimpleNamespace

from PIL import Image


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.htmlir.compiler import (  # noqa: E402
    _background_fills_from_node,
    _canonical_payload_presentation,
    _reconcile_shape_style,
    _unchanged_canonical_presentation,
)
from pptx2html.ir.builder import PresentationBuilder  # noqa: E402
from pptx2html.ir.model import Bounds, Fill, ImageInfo, Presentation, Shape, Slide  # noqa: E402
from pptx2html.opc.constants import NAMESPACE  # noqa: E402
from pptx2html.pom.shapes import Picture  # noqa: E402
from pptx2html.renderer.canonical_html_renderer import CanonicalHtmlRenderer  # noqa: E402


def png_data_url(width: int, height: int) -> str:
    output = io.BytesIO()
    Image.new("RGB", (width, height), (80, 120, 160)).save(output, format="PNG")
    return "data:image/png;base64," + base64.b64encode(output.getvalue()).decode("ascii")


def background_node(
    src: str,
    *,
    width: float,
    height: float,
    size: str,
    position: str = "50% 50%",
    repeat: str = "repeat",
) -> dict:
    return {
        "computed": {
            "backgroundClip": "border-box",
            "backgroundColor": "rgba(0, 0, 0, 0)",
            "backgroundImage": f'url("{src}")',
            "backgroundPosition": position,
            "backgroundRepeat": repeat,
            "backgroundSize": size,
            "opacity": "1",
        },
        "effectiveOpacity": 1.0,
        "rect": {"left": 0, "top": 0, "width": width, "height": height},
    }


class HtmlImageGeometryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.photo = png_data_url(1376, 768)

    def test_cover_maps_to_center_crop_without_default_repeat_tile(self) -> None:
        fill = _background_fills_from_node(
            background_node(self.photo, width=960, height=297, size="cover"),
            Bounds(0, 0, 960, 297),
        )[-1]

        self.assertEqual(fill.type, "picture")
        self.assertFalse(fill.image.tile)
        self.assertAlmostEqual(fill.image.crop_top, 0.22285, places=4)
        self.assertAlmostEqual(fill.image.crop_bottom, 0.22285, places=4)
        self.assertEqual(fill.image.crop_left, 0.0)
        self.assertEqual(fill.image.crop_right, 0.0)

    def test_cover_respects_non_center_background_position(self) -> None:
        fill = _background_fills_from_node(
            background_node(
                self.photo,
                width=384,
                height=540,
                size="cover",
                position="75% 20%",
            ),
            Bounds(0, 0, 384, 540),
        )[-1]

        self.assertFalse(fill.image.tile)
        self.assertAlmostEqual(fill.image.crop_left, 0.452325, places=4)
        self.assertAlmostEqual(fill.image.crop_right, 0.150775, places=4)
        self.assertEqual(fill.image.crop_top, 0.0)
        self.assertEqual(fill.image.crop_bottom, 0.0)

    def test_contain_no_repeat_maps_to_positioned_stretch_destination(self) -> None:
        fill = _background_fills_from_node(
            background_node(
                self.photo,
                width=384,
                height=540,
                size="contain",
                position="50% 20%",
                repeat="no-repeat",
            ),
            Bounds(0, 0, 384, 540),
        )[-1]

        self.assertFalse(fill.image.tile)
        self.assertAlmostEqual(fill.image.stretch_left, 0.0, places=6)
        self.assertAlmostEqual(fill.image.stretch_right, 0.0, places=6)
        self.assertAlmostEqual(fill.image.stretch_top, 0.12062, places=5)
        self.assertAlmostEqual(fill.image.stretch_bottom, 0.48248, places=5)

    def test_full_background_size_suppresses_repeat_because_one_image_fills_box(self) -> None:
        fill = _background_fills_from_node(
            background_node(self.photo, width=960, height=540, size="100% 100%"),
            Bounds(0, 0, 960, 540),
        )[-1]

        self.assertFalse(fill.image.tile)
        self.assertIsNone(fill.image.stretch_left)
        self.assertIsNone(fill.image.stretch_right)
        self.assertIsNone(fill.image.stretch_top)
        self.assertIsNone(fill.image.stretch_bottom)

    def test_background_layer_properties_stay_paired_when_paint_order_is_reversed(self) -> None:
        square = png_data_url(100, 100)
        node = {
            "computed": {
                "backgroundClip": "border-box",
                "backgroundColor": "rgba(0, 0, 0, 0)",
                "backgroundImage": f'url("{square}"), url("{self.photo}")',
                "backgroundPosition": "left top, center center",
                "backgroundRepeat": "no-repeat, repeat",
                "backgroundSize": "contain, cover",
                "opacity": "1",
            },
            "effectiveOpacity": 1.0,
            "rect": {"left": 0, "top": 0, "width": 960, "height": 297},
        }

        fills = _background_fills_from_node(node, Bounds(0, 0, 960, 297))

        self.assertEqual(len(fills), 2)
        self.assertAlmostEqual(fills[0].image.crop_top, 0.22285, places=4)
        self.assertFalse(fills[0].image.tile)
        self.assertEqual(fills[1].image.stretch_left, 0.0)
        self.assertGreater(fills[1].image.stretch_right, 0.0)
        self.assertFalse(fills[1].image.tile)

    def test_transparent_canonical_background_does_not_destroy_picture_fill(self) -> None:
        original = Fill(
            type="picture",
            image=ImageInfo(content_type="image/png", url=self.photo, crop_left=0.2, crop_right=0.1),
        )
        shape = Shape(type="auto_shape", bounds=Bounds(0, 0, 384, 540), fill=original)
        node = {
            "computed": {
                "backgroundColor": "rgba(0, 0, 0, 0)",
                "backgroundImage": "none",
                "opacity": "1",
            },
            "effectiveOpacity": 1.0,
        }

        _reconcile_shape_style(shape, node)

        self.assertIs(shape.fill, original)
        self.assertEqual(shape.fill.image.crop_left, 0.2)
        self.assertEqual(shape.fill.image.crop_right, 0.1)

    def test_legacy_canonical_payload_version_is_not_trusted(self) -> None:
        source = CanonicalHtmlRenderer().render(
            Presentation(width=960, height=540, slides=[Slide(index=0, shapes=[])])
        )
        legacy = source.replace('"version":1', '"version":0', 1)

        self.assertIsNotNone(_canonical_payload_presentation(source))
        self.assertIsNotNone(_unchanged_canonical_presentation(source))
        self.assertIsNone(_canonical_payload_presentation(legacy))
        self.assertIsNone(_unchanged_canonical_presentation(legacy))


class _RelatedPart:
    def __init__(self, image_part) -> None:
        self.image_part = image_part

    def related_part(self, relationship_id: str):
        return self.image_part if relationship_id == "rId1" else None


class PptxPictureGeometryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        payload = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF"
            "gAJ/lzQJLwAAAABJRU5ErkJggg=="
        )
        cls.image_part = SimpleNamespace(
            content_type="image/png",
            blob=payload,
            pack_uri=SimpleNamespace(membername="/ppt/media/image1.png"),
        )

    def picture(self, placement: str) -> Picture:
        p = NAMESPACE.PML_MAIN
        a = NAMESPACE.DML_MAIN
        r = NAMESPACE.OFC_RELATIONSHIPS
        xml = f"""
        <p:pic xmlns:p="{p}" xmlns:a="{a}" xmlns:r="{r}">
          <p:nvPicPr><p:cNvPr id="7" name="Photo"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
          <p:blipFill>
            <a:blip r:embed="rId1"><a:alphaModFix amt="80000"/></a:blip>
            <a:srcRect l="12500" r="25000" t="5000" b="15000"/>
            {placement}
          </p:blipFill>
          <p:spPr>
            <a:xfrm><a:off x="0" y="0"/><a:ext cx="1219200" cy="685800"/></a:xfrm>
            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          </p:spPr>
        </p:pic>
        """
        return Picture(ET.fromstring(xml), _RelatedPart(self.image_part))

    def test_regular_picture_parses_src_rect_and_tile_geometry(self) -> None:
        picture = self.picture('<a:tile sx="50000" sy="75000" algn="br" flip="x"/>')

        shape = PresentationBuilder()._build_picture(picture)

        self.assertEqual(shape.image.crop_left, 0.125)
        self.assertEqual(shape.image.crop_right, 0.25)
        self.assertEqual(shape.image.crop_top, 0.05)
        self.assertEqual(shape.image.crop_bottom, 0.15)
        self.assertAlmostEqual(shape.image.alpha, 0.8)
        self.assertTrue(shape.image.tile)
        self.assertEqual(shape.image.tile_scale_x, 0.5)
        self.assertEqual(shape.image.tile_scale_y, 0.75)
        self.assertEqual(shape.image.tile_align, "br")
        self.assertEqual(shape.image.tile_flip, "x")

    def test_regular_picture_parses_stretch_fill_rect_geometry(self) -> None:
        picture = self.picture(
            '<a:stretch><a:fillRect l="10000" r="20000" t="30000" b="40000"/></a:stretch>'
        )

        shape = PresentationBuilder()._build_picture(picture)

        self.assertFalse(shape.image.tile)
        self.assertEqual(shape.image.stretch_left, 0.1)
        self.assertEqual(shape.image.stretch_right, 0.2)
        self.assertEqual(shape.image.stretch_top, 0.3)
        self.assertEqual(shape.image.stretch_bottom, 0.4)


if __name__ == "__main__":
    unittest.main()
