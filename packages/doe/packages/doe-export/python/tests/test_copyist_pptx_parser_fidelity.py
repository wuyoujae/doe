from __future__ import annotations

import base64
import io
import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.ir.builder import PresentationBuilder  # noqa: E402
from pptx2html.ir.model import Bounds, ImageInfo, Shape as IRShape  # noqa: E402
from pptx2html.opc.constants import RELATIONSHIP_TYPE  # noqa: E402
from pptx2html.pom.shapes import AutoShape, GraphicFrame, GroupShape, ShapeTree  # noqa: E402
from pptx2html.renderer import CanonicalHtmlRenderer  # noqa: E402


P = "http://schemas.openxmlformats.org/presentationml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
DGM = "http://schemas.openxmlformats.org/drawingml/2006/diagram"
DSP = "http://schemas.microsoft.com/office/drawing/2008/diagram"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
TINY_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
)


def xml(source: str) -> ET.Element:
    return ET.fromstring(source.encode("utf-8"))


class DummyPart:
    pass


class FakePackUri:
    def __init__(self, membername: str):
        self.membername = membername


class FakeImagePart:
    def __init__(self, payload: bytes):
        self.blob = payload
        self.content_type = "image/png"
        self.pack_uri = FakePackUri("/ppt/media/image1.png")


class FakeSlidePart:
    def __init__(self, element: ET.Element, *, slide_layout=None, slide_master=None):
        self.element = element
        self.slide_layout = slide_layout
        self.slide_master = slide_master

    @property
    def shapes(self):
        common = self.element.find(f"{{{P}}}cSld")
        tree = common.find(f"{{{P}}}spTree") if common is not None else None
        return ShapeTree(tree if tree is not None else ET.Element(f"{{{P}}}spTree"), self)


class CopyistPptxParserFidelityTests(unittest.TestCase):
    def test_missing_picture_bytes_render_as_placeholder_without_broken_data_url(self) -> None:
        shape = IRShape(
            type="picture",
            name="Missing linked image",
            bounds=Bounds(0, 0, 320, 180),
            image=ImageInfo(content_type="image/jpeg", data=""),
        )

        rendered = CanonicalHtmlRenderer()._render_picture(shape, [])

        self.assertIn('class="pptx-image-placeholder"', rendered)
        self.assertNotIn("data:image/jpeg;base64,", rendered)

    def test_large_picture_gets_canvas_preview_while_original_stays_intact(self) -> None:
        from PIL import Image as PILImage

        source = PILImage.new("P", (2400, 1200), 0)
        source.putpalette([0, 0, 0, 183, 38, 52] + [0, 0, 0] * 254)
        source.paste(1, (300, 200, 2100, 1000))
        original_buffer = io.BytesIO()
        source.save(original_buffer, format="PNG", transparency=0)
        original = original_buffer.getvalue()

        preview_type, preview = PresentationBuilder._compressed_preview_image_blob(
            "image/png",
            original,
        )

        self.assertEqual(preview_type, "image/webp")
        self.assertIsNotNone(preview)
        self.assertLess(len(preview), len(original))
        with PILImage.open(io.BytesIO(preview)) as image:
            self.assertLessEqual(max(image.size), 1600)
            self.assertEqual(image.convert("RGBA").getpixel((0, 0))[3], 0)
        info = ImageInfo(
            content_type="image/png",
            data=base64.b64encode(original).decode("ascii"),
            preview_content_type=preview_type,
            preview_data=base64.b64encode(preview).decode("ascii"),
        )
        self.assertTrue(
            CanonicalHtmlRenderer()._image_src(info).startswith(
                "data:image/webp;base64,"
            )
        )

    def test_parallelogram_clip_uses_drawingml_adjustment_and_aspect_ratio(self) -> None:
        shape = IRShape(
            type="auto_shape",
            bounds=Bounds(0, 0, 400, 200),
            geometry="parallelogram",
            geometry_adjustments={"adj": 50000.0},
        )

        css = CanonicalHtmlRenderer()._geometry_css(shape)

        self.assertEqual(
            css,
            "clip-path:polygon(0% 100%, 25.0000% 0%, 100% 0%, 75.0000% 100%);",
        )

    def test_inherited_group_source_scope_is_propagated_to_children(self) -> None:
        shape = IRShape(
            type="group_shape",
            bounds=Bounds(0, 0, 100, 100),
            shapes=[
                IRShape(
                    type="auto_shape",
                    bounds=Bounds(0, 0, 50, 50),
                )
            ],
        )

        PresentationBuilder._mark_shape_source_scope(shape, "master")

        self.assertEqual(shape.source_scope, "master")
        self.assertEqual(shape.shapes[0].source_scope, "master")

    def test_drawingml_tint_and_gradient_text_alpha_are_preserved(self) -> None:
        builder = PresentationBuilder()
        tinted = builder._build_solid_fill(
            xml(
                f"""<a:solidFill xmlns:a="{A}">
  <a:srgbClr val="000000"><a:tint val="20000"/></a:srgbClr>
</a:solidFill>"""
            )
        )
        shape = AutoShape(
            xml(
                f"""<p:sp xmlns:p="{P}" xmlns:a="{A}">
  <p:nvSpPr><p:cNvPr id="1" name="gradient text"/></p:nvSpPr>
  <p:spPr/>
  <p:txBody><a:bodyPr/><a:p><a:r>
    <a:rPr sz="3200"><a:gradFill><a:gsLst>
      <a:gs pos="0"><a:srgbClr val="B60006"><a:alpha val="20000"/></a:srgbClr></a:gs>
      <a:gs pos="100000"><a:srgbClr val="F9503F"><a:alpha val="0"/></a:srgbClr></a:gs>
    </a:gsLst></a:gradFill></a:rPr>
    <a:t>Gradient</a:t>
  </a:r></a:p></p:txBody>
</p:sp>"""
            ),
            DummyPart(),
        )

        run = builder._build_text_frame(shape).paragraphs[0].runs[0]

        self.assertEqual(tinted.color, "CCCCCC")
        self.assertEqual(run.font.color, "B60006")
        self.assertAlmostEqual(run.font.alpha, 0.2)

    def test_group_fill_is_inherited_by_grp_fill_children(self) -> None:
        group = GroupShape(
            xml(
                f"""<p:grpSp xmlns:p="{P}" xmlns:a="{A}">
  <p:nvGrpSpPr><p:cNvPr id="20" name="gradient group"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
  <p:grpSpPr>
    <a:xfrm><a:off x="0" y="0"/><a:ext cx="1270000" cy="635000"/>
      <a:chOff x="0" y="0"/><a:chExt cx="1270000" cy="635000"/></a:xfrm>
    <a:gradFill><a:gsLst>
      <a:gs pos="0"><a:srgbClr val="0000A8"/></a:gs>
      <a:gs pos="100000"><a:srgbClr val="725BE7"/></a:gs>
    </a:gsLst></a:gradFill>
  </p:grpSpPr>
  <p:sp>
    <p:nvSpPr><p:cNvPr id="21" name="child"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
    <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1270000" cy="635000"/></a:xfrm>
      <a:prstGeom prst="rect"/><a:grpFill/></p:spPr>
  </p:sp>
</p:grpSp>"""
            ),
            DummyPart(),
        )

        parsed = PresentationBuilder()._build_group(group)

        self.assertEqual(parsed.fill.type, "gradient")
        self.assertEqual(parsed.shapes[0].fill.type, "gradient")
        self.assertEqual(
            [stop.color for stop in parsed.shapes[0].fill.gradient_stops],
            ["0000A8", "725BE7"],
        )

    def test_slide_background_picture_and_use_bg_fill_resolve_from_slide(self) -> None:
        class RelatedSlidePart(FakeSlidePart):
            def __init__(self, element: ET.Element, image_part):
                super().__init__(element)
                self.image_part = image_part

            def related_part(self, relationship_id: str):
                return self.image_part if relationship_id == "rId1" else None

        payload = base64.b64decode(TINY_PNG_B64)
        slide = RelatedSlidePart(
            xml(
                f"""<p:sld xmlns:p="{P}" xmlns:a="{A}" xmlns:r="{R}">
  <p:cSld><p:bg><p:bgPr><a:blipFill>
    <a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch>
  </a:blipFill></p:bgPr></p:bg></p:cSld>
</p:sld>"""
            ),
            FakeImagePart(payload),
        )
        builder = PresentationBuilder()
        background = builder._build_background(slide)
        builder._active_slide_part = slide
        shape = AutoShape(
            xml(
                f"""<p:sp xmlns:p="{P}" xmlns:a="{A}" useBgFill="1">
  <p:nvSpPr><p:cNvPr id="1" name="background panel"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="914400"/></a:xfrm>
    <a:prstGeom prst="rect"/></p:spPr>
</p:sp>"""
            ),
            DummyPart(),
        )

        inherited = builder._build_fill(shape)

        self.assertEqual(background.fill.type, "picture")
        self.assertEqual(base64.b64decode(background.fill.image.data), payload)
        self.assertEqual(inherited.type, "picture")
        self.assertEqual(base64.b64decode(inherited.image.data), payload)

    def test_owner_theme_and_color_map_are_resolved_per_master(self) -> None:
        class ThemePart:
            def __init__(self, element: ET.Element):
                self.element = element

        class ThemeAwarePart(FakeSlidePart):
            def __init__(self, element: ET.Element, *, theme=None, slide_layout=None, slide_master=None):
                super().__init__(
                    element,
                    slide_layout=slide_layout,
                    slide_master=slide_master,
                )
                self.theme = theme

            def related_parts(self, relationship_type: str):
                if relationship_type == RELATIONSHIP_TYPE.THEME and self.theme is not None:
                    return [self.theme]
                return []

        theme = ThemePart(
            xml(
                f"""<a:theme xmlns:a="{A}"><a:themeElements><a:clrScheme name="Owner">
  <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
  <a:dk2><a:srgbClr val="000AD2"/></a:dk2>
</a:clrScheme></a:themeElements></a:theme>"""
            )
        )
        master = ThemeAwarePart(
            xml(
                f"""<p:sldMaster xmlns:p="{P}" xmlns:a="{A}">
  <p:cSld/><p:clrMap bg2="lt2" tx2="dk2"/>
</p:sldMaster>"""
            ),
            theme=theme,
        )
        layout = ThemeAwarePart(
            xml(
                f"""<p:sldLayout xmlns:p="{P}" xmlns:a="{A}">
  <p:cSld/><p:clrMapOvr><a:overrideClrMapping bg2="dk2"/></p:clrMapOvr>
</p:sldLayout>"""
            ),
            slide_master=master,
        )
        slide = ThemeAwarePart(
            xml(f'<p:sld xmlns:p="{P}" xmlns:a="{A}"><p:cSld/></p:sld>'),
            slide_layout=layout,
        )
        builder = PresentationBuilder()
        builder._theme_colors = {"lt2": "EEEEEE", "dk2": "222222"}
        builder._active_color_owner = slide

        self.assertEqual(builder._resolve_color("bg2"), "000AD2")

    def test_native_table_style_fill_and_borders_are_materialized(self) -> None:
        builder = PresentationBuilder()
        builder._theme_colors = {
            "lt1": "FFFFFF",
            "accent1": "5B9BD5",
        }
        style_id = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"
        style_root = xml(
            f"""<a:tblStyleLst xmlns:a="{A}"><a:tblStyle styleId="{style_id}">
  <a:wholeTbl><a:tcStyle>
    <a:tcBdr>
      <a:left><a:ln w="12700"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:ln></a:left>
      <a:right><a:ln w="12700"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:ln></a:right>
      <a:top><a:ln w="12700"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:ln></a:top>
      <a:bottom><a:ln w="12700"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:ln></a:bottom>
      <a:insideH><a:ln w="12700"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:ln></a:insideH>
      <a:insideV><a:ln w="12700"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:ln></a:insideV>
    </a:tcBdr>
    <a:fill><a:solidFill><a:schemeClr val="accent1"><a:tint val="20000"/></a:schemeClr></a:solidFill></a:fill>
  </a:tcStyle></a:wholeTbl>
  <a:firstRow><a:tcStyle>
    <a:tcBdr><a:bottom><a:ln w="38100"><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:ln></a:bottom></a:tcBdr>
    <a:fill><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:fill>
  </a:tcStyle></a:firstRow>
</a:tblStyle></a:tblStyleLst>"""
        )
        builder._table_cell_style_elements = builder._parse_table_cell_style_elements(
            style_root
        )
        frame = GraphicFrame(
            xml(
                f"""<p:graphicFrame xmlns:p="{P}" xmlns:a="{A}">
  <p:nvGraphicFramePr><p:cNvPr id="3" name="table"/></p:nvGraphicFramePr><a:xfrm/>
  <a:graphic><a:graphicData><a:tbl>
    <a:tblPr firstRow="1"><a:tableStyleId>{style_id}</a:tableStyleId></a:tblPr>
    <a:tblGrid><a:gridCol w="127000"/><a:gridCol w="127000"/></a:tblGrid>
    <a:tr h="38100"><a:tc><a:txBody><a:bodyPr/><a:p/></a:txBody></a:tc>
      <a:tc><a:txBody><a:bodyPr/><a:p/></a:txBody></a:tc></a:tr>
    <a:tr h="38100"><a:tc><a:txBody><a:bodyPr/><a:p/></a:txBody></a:tc>
      <a:tc><a:txBody><a:bodyPr/><a:p/></a:txBody></a:tc></a:tr>
  </a:tbl></a:graphicData></a:graphic>
</p:graphicFrame>"""
            ),
            DummyPart(),
        )

        table = builder._build_table(frame)

        self.assertEqual(table.rows[0][0].fill.color, "5B9BD5")
        self.assertEqual(table.rows[0][0].border_bottom.width, 3.0)
        self.assertEqual(table.rows[1][1].fill.color, "DEEBF7")
        self.assertEqual(table.rows[1][1].border_left.color, "FFFFFF")

    def test_smartart_cached_drawing_becomes_editable_group(self) -> None:
        class XmlPart:
            def __init__(self, element: ET.Element):
                self.element = element

        data_part = XmlPart(
            xml(
                f"""<dgm:dataModel xmlns:dgm="{DGM}" xmlns:a="{A}" xmlns:dsp="{DSP}">
  <dgm:extLst><a:ext><dsp:dataModelExt relId="rIdDrawing"/></a:ext></dgm:extLst>
</dgm:dataModel>"""
            )
        )
        drawing_part = XmlPart(
            xml(
                f"""<dsp:drawing xmlns:dsp="{DSP}" xmlns:a="{A}"><dsp:spTree>
  <dsp:nvGrpSpPr><dsp:cNvPr id="1" name="group"/><dsp:cNvGrpSpPr/></dsp:nvGrpSpPr>
  <dsp:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="914400"/></a:xfrm></dsp:grpSpPr>
  <dsp:sp><dsp:nvSpPr><dsp:cNvPr id="2" name="child"/><dsp:cNvSpPr/></dsp:nvSpPr>
    <dsp:spPr><a:xfrm><a:off x="127000" y="254000"/><a:ext cx="635000" cy="381000"/></a:xfrm>
      <a:prstGeom prst="roundRect"/><a:solidFill><a:srgbClr val="336699"/></a:solidFill></dsp:spPr>
    <dsp:txBody><a:bodyPr/><a:p><a:r><a:t>Editable</a:t></a:r></a:p></dsp:txBody>
  </dsp:sp>
</dsp:spTree></dsp:drawing>"""
            )
        )

        class DiagramSlidePart:
            def related_part(self, relationship_id: str):
                return {
                    "rIdDiagramData": data_part,
                    "rIdDrawing": drawing_part,
                }.get(relationship_id)

            def related_parts(self, relationship_type: str):
                return []

        frame = GraphicFrame(
            xml(
                f"""<p:graphicFrame xmlns:p="{P}" xmlns:a="{A}" xmlns:dgm="{DGM}" xmlns:r="{R}">
  <p:nvGraphicFramePr><p:cNvPr id="8" name="smartart"/></p:nvGraphicFramePr>
  <p:xfrm><a:off x="914400" y="1828800"/><a:ext cx="4572000" cy="2743200"/></p:xfrm>
  <a:graphic><a:graphicData uri="{DGM}"><dgm:relIds r:dm="rIdDiagramData"/></a:graphicData></a:graphic>
</p:graphicFrame>"""
            ),
            DiagramSlidePart(),
        )

        parsed = PresentationBuilder()._build_graphic_frame(frame)

        self.assertEqual(parsed.type, "group_shape")
        self.assertEqual(len(parsed.shapes), 1)
        self.assertEqual(parsed.shapes[0].text.text, "Editable")
        self.assertEqual(parsed.shapes[0].fill.color, "336699")


if __name__ == "__main__":
    unittest.main()
