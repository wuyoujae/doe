from __future__ import annotations

import base64
import copy
import io
import posixpath
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

from PIL import Image as PILImage
from PIL import features as pil_features


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.server.pptx_writer import write_pptx_from_ir  # noqa: E402
from pptx_pipeline import import_pptx_to_canonical  # noqa: E402


P = "http://schemas.openxmlformats.org/presentationml/2006/main"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
CT = "http://schemas.openxmlformats.org/package/2006/content-types"
ASVG = "http://schemas.microsoft.com/office/drawing/2016/SVG/main"
EMU_PER_PT = 12700


def _image_bytes(image_format: str, color: tuple[int, int, int, int]) -> bytes:
    stream = io.BytesIO()
    PILImage.new("RGBA", (18, 12), color).save(stream, format=image_format, lossless=True)
    return stream.getvalue()


def _image_ir(data: bytes, content_type: str, **extra) -> dict:
    return {
        "data": base64.b64encode(data).decode("ascii"),
        "content_type": content_type,
        **extra,
    }


def _picture(shape_id: int, name: str, image: dict, left: float = 20) -> dict:
    return {
        "type": "picture",
        "shape_id": shape_id,
        "name": name,
        "bounds": {"left": left, "top": 20, "width": 240, "height": 160},
        "image": image,
        "effects": [],
    }


def _auto_shape(fill: dict) -> dict:
    return {
        "type": "auto_shape",
        "shape_id": 2,
        "name": "Rectangle 1",
        "geometry": "rect",
        "bounds": {"left": 40, "top": 30, "width": 420, "height": 260},
        "fill": fill,
        "border": {"width": 2, "color": "203040"},
        "shadow": {
            "type": "outer",
            "blur_pt": 4,
            "offset_x": 2,
            "offset_y": 3,
            "color": "000000",
            "alpha": 0.25,
        },
    }


def _table_shape(fill: dict) -> dict:
    return {
        "type": "graphic_frame",
        "shape_id": 3,
        "name": "Table 1",
        "bounds": {"left": 500, "top": 30, "width": 300, "height": 120},
        "table": {
            "rows": [[{"text": "Cell", "fill": fill}]],
            "col_widths": [300],
            "row_heights": [120],
        },
    }


def _presentation(*shapes: dict, background: dict | None = None) -> dict:
    return {
        "width": 960,
        "height": 540,
        "slides": [
            {
                "index": 0,
                "name": "Slide 1",
                "background": background,
                "shapes": list(shapes),
            }
        ],
    }


def _slide_xml(package: zipfile.ZipFile) -> ET.Element:
    return ET.fromstring(package.read("ppt/slides/slide1.xml"))


def _slide_rels(package: zipfile.ZipFile) -> ET.Element:
    return ET.fromstring(package.read("ppt/slides/_rels/slide1.xml.rels"))


def _embedded_media(package: zipfile.ZipFile, embed_id: str) -> tuple[str, bytes]:
    rels = _slide_rels(package)
    relationship = next(
        rel
        for rel in rels.findall(f"{{{REL}}}Relationship")
        if rel.get("Id") == embed_id
    )
    target = relationship.get("Target") or ""
    part = posixpath.normpath(posixpath.join("ppt/slides", target))
    return part, package.read(part)


def _with_office_svg_relationship(source_pptx: bytes, svg_payload: bytes) -> tuple[bytes, str, str, str, str]:
    with zipfile.ZipFile(io.BytesIO(source_pptx)) as package:
        files = {name: package.read(name) for name in package.namelist()}

    slide_root = ET.fromstring(files["ppt/slides/slide1.xml"])
    blip = slide_root.find(f".//{{{P}}}pic/{{{P}}}blipFill/{{{A}}}blip")
    outer_relationship_id = blip.get(f"{{{R}}}embed")

    rels_root = ET.fromstring(files["ppt/slides/_rels/slide1.xml.rels"])
    outer_relationship = next(
        relationship
        for relationship in rels_root.findall(f"{{{REL}}}Relationship")
        if relationship.get("Id") == outer_relationship_id
    )
    outer_media_part = posixpath.normpath(
        posixpath.join("ppt/slides", outer_relationship.get("Target") or "")
    )

    used_ids = {relationship.get("Id") for relationship in rels_root}
    svg_relationship_number = 900
    while f"rId{svg_relationship_number}" in used_ids:
        svg_relationship_number += 1
    svg_relationship_id = f"rId{svg_relationship_number}"
    svg_media_part = "ppt/media/legacy-office-vector.svg"
    ET.SubElement(
        rels_root,
        f"{{{REL}}}Relationship",
        {
            "Id": svg_relationship_id,
            "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            "Target": "../media/legacy-office-vector.svg",
        },
    )

    ext_lst = ET.SubElement(blip, f"{{{A}}}extLst")
    extension = ET.SubElement(
        ext_lst,
        f"{{{A}}}ext",
        {"uri": "{96DAC541-7B7A-43D3-8B79-37D633B846F1}"},
    )
    ET.SubElement(
        extension,
        f"{{{ASVG}}}svgBlip",
        {f"{{{R}}}embed": svg_relationship_id},
    )

    content_types = ET.fromstring(files["[Content_Types].xml"])
    if not any(
        default.get("Extension") == "svg"
        for default in content_types.findall(f"{{{CT}}}Default")
    ):
        ET.SubElement(
            content_types,
            f"{{{CT}}}Default",
            {"Extension": "svg", "ContentType": "image/svg+xml"},
        )

    files["ppt/slides/slide1.xml"] = ET.tostring(slide_root, encoding="utf-8", xml_declaration=True)
    files["ppt/slides/_rels/slide1.xml.rels"] = ET.tostring(
        rels_root,
        encoding="utf-8",
        xml_declaration=True,
    )
    files["[Content_Types].xml"] = ET.tostring(
        content_types,
        encoding="utf-8",
        xml_declaration=True,
    )
    files[svg_media_part] = svg_payload

    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as package:
        for name, data in files.items():
            package.writestr(name, data)
    return (
        output.getvalue(),
        outer_relationship_id,
        svg_relationship_id,
        outer_media_part,
        svg_media_part,
    )


def _with_office_svg_fill_relationships(
    source_pptx: bytes,
    svg_payload: bytes,
) -> tuple[bytes, list[tuple[str, str, str]]]:
    """Add Office raster-fallback + SVG relationships to all picture fills."""
    with zipfile.ZipFile(io.BytesIO(source_pptx)) as package:
        files = {name: package.read(name) for name in package.namelist()}

    slide_root = ET.fromstring(files["ppt/slides/slide1.xml"])
    fill_blips = [
        slide_root.find(
            f"{{{P}}}cSld/{{{P}}}bg/{{{P}}}bgPr/{{{A}}}blipFill/{{{A}}}blip"
        ),
        slide_root.find(f".//{{{P}}}sp/{{{P}}}spPr/{{{A}}}blipFill/{{{A}}}blip"),
        slide_root.find(f".//{{{A}}}tc/{{{A}}}tcPr/{{{A}}}blipFill/{{{A}}}blip"),
    ]
    if any(blip is None for blip in fill_blips):
        raise AssertionError("Expected background, shape, and table picture fills")

    rels_root = ET.fromstring(files["ppt/slides/_rels/slide1.xml.rels"])
    used_ids = {relationship.get("Id") for relationship in rels_root}
    records: list[tuple[str, str, str]] = []
    next_id = 900
    for index, blip in enumerate(fill_blips, start=1):
        while f"rId{next_id}" in used_ids:
            next_id += 1
        svg_relationship_id = f"rId{next_id}"
        used_ids.add(svg_relationship_id)
        next_id += 1
        svg_media_part = f"ppt/media/office-fill-vector-{index}.svg"
        ET.SubElement(
            rels_root,
            f"{{{REL}}}Relationship",
            {
                "Id": svg_relationship_id,
                "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                "Target": f"../media/office-fill-vector-{index}.svg",
            },
        )
        ext_lst = ET.SubElement(blip, f"{{{A}}}extLst")
        extension = ET.SubElement(
            ext_lst,
            f"{{{A}}}ext",
            {"uri": "{96DAC541-7B7A-43D3-8B79-37D633B846F1}"},
        )
        ET.SubElement(
            extension,
            f"{{{ASVG}}}svgBlip",
            {f"{{{R}}}embed": svg_relationship_id},
        )
        files[svg_media_part] = svg_payload
        records.append(
            (
                blip.get(f"{{{R}}}embed"),
                svg_relationship_id,
                svg_media_part,
            )
        )

    content_types = ET.fromstring(files["[Content_Types].xml"])
    if not any(
        default.get("Extension") == "svg"
        for default in content_types.findall(f"{{{CT}}}Default")
    ):
        ET.SubElement(
            content_types,
            f"{{{CT}}}Default",
            {"Extension": "svg", "ContentType": "image/svg+xml"},
        )

    files["ppt/slides/slide1.xml"] = ET.tostring(
        slide_root,
        encoding="utf-8",
        xml_declaration=True,
    )
    files["ppt/slides/_rels/slide1.xml.rels"] = ET.tostring(
        rels_root,
        encoding="utf-8",
        xml_declaration=True,
    )
    files["[Content_Types].xml"] = ET.tostring(
        content_types,
        encoding="utf-8",
        xml_declaration=True,
    )
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as package:
        for name, data in files.items():
            package.writestr(name, data)
    return output.getvalue(), records


def _group_xfrm(
    *,
    left: float,
    top: float,
    width: float,
    height: float,
    child_left: float,
    child_top: float,
    child_width: float,
    child_height: float,
) -> ET.Element:
    xfrm = ET.Element(f"{{{A}}}xfrm")
    ET.SubElement(
        xfrm,
        f"{{{A}}}off",
        {"x": str(round(left * EMU_PER_PT)), "y": str(round(top * EMU_PER_PT))},
    )
    ET.SubElement(
        xfrm,
        f"{{{A}}}ext",
        {"cx": str(round(width * EMU_PER_PT)), "cy": str(round(height * EMU_PER_PT))},
    )
    ET.SubElement(
        xfrm,
        f"{{{A}}}chOff",
        {"x": str(round(child_left * EMU_PER_PT)), "y": str(round(child_top * EMU_PER_PT))},
    )
    ET.SubElement(
        xfrm,
        f"{{{A}}}chExt",
        {"cx": str(round(child_width * EMU_PER_PT)), "cy": str(round(child_height * EMU_PER_PT))},
    )
    return xfrm


def _group_element(
    shape_id: int,
    name: str,
    xfrm: ET.Element,
    child: ET.Element,
    *,
    extension_uri: str | None = None,
) -> ET.Element:
    group = ET.Element(f"{{{P}}}grpSp")
    non_visual = ET.SubElement(group, f"{{{P}}}nvGrpSpPr")
    ET.SubElement(
        non_visual,
        f"{{{P}}}cNvPr",
        {"id": str(shape_id), "name": name},
    )
    ET.SubElement(non_visual, f"{{{P}}}cNvGrpSpPr")
    ET.SubElement(non_visual, f"{{{P}}}nvPr")
    group_properties = ET.SubElement(group, f"{{{P}}}grpSpPr")
    group_properties.append(xfrm)
    group.append(child)
    if extension_uri:
        extension_list = ET.SubElement(group, f"{{{P}}}extLst")
        ET.SubElement(extension_list, f"{{{P}}}ext", {"uri": extension_uri})
    return group


def _with_nested_picture_groups(source_pptx: bytes) -> bytes:
    with zipfile.ZipFile(io.BytesIO(source_pptx)) as package:
        files = {name: package.read(name) for name in package.namelist()}

    slide_root = ET.fromstring(files["ppt/slides/slide1.xml"])
    shape_tree = slide_root.find(f"{{{P}}}cSld/{{{P}}}spTree")
    picture = shape_tree.find(f"{{{P}}}pic")
    shape_tree.remove(picture)

    inner = _group_element(
        5,
        "Inner Group",
        _group_xfrm(
            left=30,
            top=40,
            width=160,
            height=80,
            child_left=10,
            child_top=20,
            child_width=80,
            child_height=40,
        ),
        picture,
        extension_uri="{YRKIE-INNER-GROUP-PAYLOAD}",
    )
    outer = _group_element(
        6,
        "Outer Group",
        _group_xfrm(
            left=100,
            top=50,
            width=400,
            height=200,
            child_left=10,
            child_top=20,
            child_width=200,
            child_height=100,
        ),
        inner,
        extension_uri="{YRKIE-OUTER-GROUP-PAYLOAD}",
    )
    shape_tree.append(outer)
    files["ppt/slides/slide1.xml"] = ET.tostring(
        slide_root,
        encoding="utf-8",
        xml_declaration=True,
    )

    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as package:
        for name, data in files.items():
            package.writestr(name, data)
    return output.getvalue()


class PptxWriterImageTests(unittest.TestCase):
    @unittest.skipUnless(pil_features.check("webp"), "Pillow WebP support is unavailable")
    def test_source_free_picture_writes_tile_stretch_crop_alpha_and_normalizes_webp(self) -> None:
        webp = _image_bytes("WEBP", (220, 30, 40, 180))
        tiled = _image_ir(
            webp,
            "image/webp",
            crop_left=0.1,
            crop_right=0.2,
            crop_top=0.03,
            crop_bottom=0.04,
            alpha=0.6,
            tile=True,
            tile_scale_x=1.5,
            tile_scale_y=0.5,
            tile_align="ctr",
            tile_flip="x",
        )
        stretched = _image_ir(
            webp,
            "image/webp",
            stretch_left=0.11,
            stretch_right=0.12,
            stretch_top=0.13,
            stretch_bottom=0.14,
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "pictures.pptx"
            write_pptx_from_ir(
                _presentation(
                    _picture(2, "Picture 1", tiled),
                    _picture(3, "Picture 2", stretched, left=300),
                ),
                output,
            )
            with zipfile.ZipFile(output) as package:
                root = _slide_xml(package)
                pictures = root.findall(f".//{{{P}}}pic")
                self.assertEqual(len(pictures), 2)

                first_fill = pictures[0].find(f"{{{P}}}blipFill")
                self.assertIsNotNone(first_fill)
                src_rect = first_fill.find(f"{{{A}}}srcRect")
                self.assertEqual(src_rect.attrib, {"l": "10000", "r": "20000", "t": "3000", "b": "4000"})
                tile = first_fill.find(f"{{{A}}}tile")
                self.assertEqual(
                    tile.attrib,
                    {"sx": "150000", "sy": "50000", "algn": "ctr", "flip": "x"},
                )
                self.assertIsNone(first_fill.find(f"{{{A}}}stretch"))
                alpha = first_fill.find(f"{{{A}}}blip/{{{A}}}alphaModFix")
                self.assertEqual(alpha.get("amt"), "60000")

                second_fill = pictures[1].find(f"{{{P}}}blipFill")
                self.assertIsNone(second_fill.find(f"{{{A}}}tile"))
                fill_rect = second_fill.find(f"{{{A}}}stretch/{{{A}}}fillRect")
                self.assertEqual(fill_rect.attrib, {"l": "11000", "r": "12000", "t": "13000", "b": "14000"})

                embeds = [
                    picture.find(f"{{{P}}}blipFill/{{{A}}}blip").get(f"{{{R}}}embed")
                    for picture in pictures
                ]
                for embed in embeds:
                    media_part, media = _embedded_media(package, embed)
                    self.assertTrue(media_part.endswith(".png"), media_part)
                    with PILImage.open(io.BytesIO(media)) as normalized:
                        self.assertEqual(normalized.format, "PNG")

    def test_source_free_svg_is_rasterized_to_a_transparent_intrinsic_size_png(self) -> None:
        svg = b'''<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20">
<rect x="10" y="5" width="20" height="10" fill="#00aa88"/>
</svg>'''
        presentation = _presentation(
            _picture(2, "Vector picture", _image_ir(svg, "image/svg+xml")),
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "source-free-svg.pptx"
            write_pptx_from_ir(presentation, output_path)
            with zipfile.ZipFile(output_path) as package:
                blip = _slide_xml(package).find(
                    f".//{{{P}}}pic/{{{P}}}blipFill/{{{A}}}blip"
                )
                media_part, media = _embedded_media(
                    package,
                    blip.get(f"{{{R}}}embed"),
                )
                self.assertTrue(media_part.endswith(".png"), media_part)
                with PILImage.open(io.BytesIO(media)) as raster:
                    self.assertEqual(raster.format, "PNG")
                    self.assertEqual(raster.size, (40, 20))
                    self.assertIn("A", raster.getbands())
                    self.assertEqual(raster.convert("RGBA").getpixel((0, 0))[3], 0)
                    self.assertGreater(raster.convert("RGBA").getpixel((20, 10))[3], 240)

    def test_source_free_opaque_svg_exports_as_picture_and_shape_fill(self) -> None:
        svg = b'''<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20">
<rect width="40" height="20" fill="#00aa88"/>
</svg>'''
        image = _image_ir(svg, "image/svg+xml")
        shape = _auto_shape({"type": "picture", "image": image})
        shape["shape_id"] = 3
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "opaque-svg.pptx"
            write_pptx_from_ir(
                _presentation(_picture(2, "Opaque vector picture", image), shape),
                output,
            )
            with zipfile.ZipFile(output) as package:
                blips = _slide_xml(package).findall(f".//{{{A}}}blip")
                self.assertEqual(len(blips), 2)
                for blip in blips:
                    media_part, media = _embedded_media(package, blip.get(f"{{{R}}}embed"))
                    self.assertTrue(media_part.endswith(".png"), media_part)
                    with PILImage.open(io.BytesIO(media)) as raster:
                        self.assertEqual(raster.format, "PNG")
                        self.assertEqual(raster.size, (40, 20))
                        rgba = raster.convert("RGBA")
                        self.assertEqual(rgba.getpixel((0, 0)), (0, 170, 136, 255))
                        self.assertEqual(rgba.getpixel((20, 10)), (0, 170, 136, 255))

    def test_source_free_svg_preserves_partial_alpha_without_flattening(self) -> None:
        svg = b'''<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20">
<rect x="10" y="5" width="20" height="10" fill="#00aa88" fill-opacity="0.5"/>
</svg>'''
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "partial-alpha-svg.pptx"
            write_pptx_from_ir(
                _presentation(_picture(2, "Translucent vector picture", _image_ir(svg, "image/svg+xml"))),
                output,
            )
            with zipfile.ZipFile(output) as package:
                blip = _slide_xml(package).find(f".//{{{P}}}pic/{{{P}}}blipFill/{{{A}}}blip")
                _, media = _embedded_media(package, blip.get(f"{{{R}}}embed"))
                with PILImage.open(io.BytesIO(media)) as raster:
                    self.assertEqual(raster.format, "PNG")
                    self.assertEqual(raster.size, (40, 20))
                    self.assertIn("A", raster.getbands())
                    rgba = raster.convert("RGBA")
                    self.assertEqual(rgba.getpixel((0, 0))[3], 0)
                    red, green, blue, alpha = rgba.getpixel((20, 10))
                    self.assertEqual(red, 0)
                    self.assertAlmostEqual(green, 170, delta=1)
                    self.assertAlmostEqual(blue, 136, delta=1)
                    self.assertAlmostEqual(alpha, 128, delta=1)

    def test_source_backed_crop_keeps_relationship_and_replacement_adds_media(self) -> None:
        red = _image_bytes("PNG", (255, 0, 0, 255))
        blue = _image_bytes("PNG", (0, 40, 255, 255))
        original = _presentation(
            _picture(2, "Picture 1", _image_ir(red, "image/png")),
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "source.pptx"
            cropped_path = Path(temp_dir) / "cropped.pptx"
            replaced_path = Path(temp_dir) / "replaced.pptx"
            write_pptx_from_ir(original, source_path)
            source_bytes = source_path.read_bytes()
            with zipfile.ZipFile(io.BytesIO(source_bytes)) as package:
                source_blip = _slide_xml(package).find(f".//{{{P}}}pic/{{{P}}}blipFill/{{{A}}}blip")
                source_embed = source_blip.get(f"{{{R}}}embed")

            cropped = copy.deepcopy(original)
            cropped_image = cropped["slides"][0]["shapes"][0]["image"]
            cropped_image.update(
                crop_left=0.21,
                crop_bottom=0.17,
                alpha=0.45,
                tile=True,
                tile_scale_x=0.75,
                tile_scale_y=1.25,
            )
            write_pptx_from_ir(
                cropped,
                cropped_path,
                source_pptx=source_bytes,
                original_ir=original,
            )
            with zipfile.ZipFile(cropped_path) as package:
                fill = _slide_xml(package).find(f".//{{{P}}}pic/{{{P}}}blipFill")
                blip = fill.find(f"{{{A}}}blip")
                self.assertEqual(blip.get(f"{{{R}}}embed"), source_embed)
                self.assertEqual(fill.find(f"{{{A}}}srcRect").attrib, {"l": "21000", "b": "17000"})
                self.assertEqual(fill.find(f"{{{A}}}tile").attrib, {"sx": "75000", "sy": "125000"})
                self.assertEqual(blip.find(f"{{{A}}}alphaModFix").get("amt"), "45000")

            replaced = copy.deepcopy(original)
            replaced["slides"][0]["shapes"][0]["image"] = _image_ir(
                blue,
                "image/png",
                crop_top=0.12,
            )
            write_pptx_from_ir(
                replaced,
                replaced_path,
                source_pptx=source_bytes,
                original_ir=original,
            )
            with zipfile.ZipFile(replaced_path) as package:
                fill = _slide_xml(package).find(f".//{{{P}}}pic/{{{P}}}blipFill")
                replacement_embed = fill.find(f"{{{A}}}blip").get(f"{{{R}}}embed")
                self.assertNotEqual(replacement_embed, source_embed)
                _part, replacement_media = _embedded_media(package, replacement_embed)
                self.assertEqual(replacement_media, blue)
                self.assertEqual(fill.find(f"{{{A}}}srcRect").attrib, {"t": "12000"})

    def test_source_backed_nested_group_picture_replacement_preserves_group_xml_and_maps_coordinates(self) -> None:
        red = _image_bytes("PNG", (255, 0, 0, 255))
        blue = _image_bytes("PNG", (0, 40, 255, 255))
        source_picture = _picture(2, "Picture 1", _image_ir(red, "image/png"))
        source_picture["bounds"] = {"left": 50, "top": 30, "width": 40, "height": 20}

        original_picture = _picture(2, "Picture 1", _image_ir(red, "image/png"))
        # Inner group: ext 160x80, chOff 10,20, chExt 80x40.
        original_picture["bounds"] = {"left": 80, "top": 20, "width": 80, "height": 40}
        inner_group = {
            "type": "group_shape",
            "shape_id": 5,
            "name": "Inner Group",
            # Outer group: ext 400x200, chOff 10,20, chExt 200x100.
            "bounds": {"left": 40, "top": 40, "width": 320, "height": 160},
            "group_bounds": {"left": 10, "top": 20, "width": 80, "height": 40},
            "shapes": [original_picture],
        }
        outer_group = {
            "type": "group_shape",
            "shape_id": 6,
            "name": "Outer Group",
            "bounds": {"left": 100, "top": 50, "width": 400, "height": 200},
            "group_bounds": {"left": 10, "top": 20, "width": 200, "height": 100},
            "shapes": [inner_group],
        }
        original_ir = _presentation(outer_group)
        desired_ir = copy.deepcopy(original_ir)
        desired_outer = desired_ir["slides"][0]["shapes"][0]
        desired_outer["bounds"]["left"] = 120
        desired_outer["bounds"]["top"] = 70
        desired_inner = desired_outer["shapes"][0]
        desired_inner["bounds"]["left"] = 60
        desired_inner["bounds"]["top"] = 50
        desired_picture = desired_inner["shapes"][0]
        desired_picture["bounds"] = {"left": 100, "top": 24, "width": 100, "height": 50}
        desired_picture["image"] = _image_ir(
            blue,
            "image/png",
            crop_left=0.2,
            crop_bottom=0.1,
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            flat_source = Path(temp_dir) / "flat-source.pptx"
            output_path = Path(temp_dir) / "nested-group-edited.pptx"
            write_pptx_from_ir(_presentation(source_picture), flat_source)
            source_bytes = _with_nested_picture_groups(flat_source.read_bytes())
            write_pptx_from_ir(
                desired_ir,
                output_path,
                source_pptx=source_bytes,
                original_ir=original_ir,
            )

            with zipfile.ZipFile(output_path) as package:
                root = _slide_xml(package)
                groups = root.findall(f".//{{{P}}}grpSp")
                self.assertEqual(len(groups), 2)
                outer, inner = groups
                outer_xfrm = outer.find(f"{{{P}}}grpSpPr/{{{A}}}xfrm")
                self.assertEqual(
                    outer_xfrm.find(f"{{{A}}}off").attrib,
                    {"x": str(120 * EMU_PER_PT), "y": str(70 * EMU_PER_PT)},
                )
                self.assertEqual(
                    outer_xfrm.find(f"{{{A}}}chOff").attrib,
                    {"x": str(10 * EMU_PER_PT), "y": str(20 * EMU_PER_PT)},
                )
                self.assertEqual(
                    outer_xfrm.find(f"{{{A}}}chExt").attrib,
                    {"cx": str(200 * EMU_PER_PT), "cy": str(100 * EMU_PER_PT)},
                )

                inner_xfrm = inner.find(f"{{{P}}}grpSpPr/{{{A}}}xfrm")
                self.assertEqual(
                    inner_xfrm.find(f"{{{A}}}off").attrib,
                    {"x": str(40 * EMU_PER_PT), "y": str(45 * EMU_PER_PT)},
                )
                self.assertEqual(
                    inner_xfrm.find(f"{{{A}}}ext").attrib,
                    {"cx": str(160 * EMU_PER_PT), "cy": str(80 * EMU_PER_PT)},
                )
                self.assertEqual(
                    inner_xfrm.find(f"{{{A}}}chOff").attrib,
                    {"x": str(10 * EMU_PER_PT), "y": str(20 * EMU_PER_PT)},
                )

                picture = inner.find(f"{{{P}}}pic")
                picture_xfrm = picture.find(f"{{{P}}}spPr/{{{A}}}xfrm")
                self.assertEqual(
                    picture_xfrm.find(f"{{{A}}}off").attrib,
                    {"x": str(60 * EMU_PER_PT), "y": str(32 * EMU_PER_PT)},
                )
                self.assertEqual(
                    picture_xfrm.find(f"{{{A}}}ext").attrib,
                    {"cx": str(50 * EMU_PER_PT), "cy": str(25 * EMU_PER_PT)},
                )
                blip_fill = picture.find(f"{{{P}}}blipFill")
                self.assertEqual(
                    blip_fill.find(f"{{{A}}}srcRect").attrib,
                    {"l": "20000", "b": "10000"},
                )
                embed_id = blip_fill.find(f"{{{A}}}blip").get(f"{{{R}}}embed")
                _part, replacement_media = _embedded_media(package, embed_id)
                self.assertEqual(replacement_media, blue)

                extension_uris = {
                    extension.get("uri")
                    for extension in root.findall(f".//{{{P}}}grpSp/{{{P}}}extLst/{{{P}}}ext")
                }
                self.assertEqual(
                    extension_uris,
                    {"{YRKIE-INNER-GROUP-PAYLOAD}", "{YRKIE-OUTER-GROUP-PAYLOAD}"},
                )

            deleted_ir = copy.deepcopy(original_ir)
            deleted_ir["slides"][0]["shapes"][0]["shapes"][0]["shapes"] = []
            deleted_path = Path(temp_dir) / "nested-group-picture-deleted.pptx"
            write_pptx_from_ir(
                deleted_ir,
                deleted_path,
                source_pptx=source_bytes,
                original_ir=original_ir,
            )
            with zipfile.ZipFile(deleted_path) as package:
                root = _slide_xml(package)
                self.assertIsNone(root.find(f".//{{{P}}}grpSp/{{{P}}}pic"))
                image_relationships = [
                    relationship
                    for relationship in _slide_rels(package).findall(f"{{{REL}}}Relationship")
                    if relationship.get("Type")
                    == "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
                ]
                self.assertEqual(image_relationships, [])
                extension_uris = {
                    extension.get("uri")
                    for extension in root.findall(f".//{{{P}}}grpSp/{{{P}}}extLst/{{{P}}}ext")
                }
                self.assertEqual(
                    extension_uris,
                    {"{YRKIE-INNER-GROUP-PAYLOAD}", "{YRKIE-OUTER-GROUP-PAYLOAD}"},
                )

    def test_source_backed_office_svg_replacement_rewrites_both_blip_relationships(self) -> None:
        red = _image_bytes("PNG", (255, 0, 0, 255))
        blue = _image_bytes("PNG", (0, 40, 255, 255))
        old_svg = b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>'
        new_svg = b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle cx="5" cy="5" r="5" fill="blue"/></svg>'
        original = _presentation(_picture(2, "Picture 1", _image_ir(red, "image/png")))

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "source.pptx"
            write_pptx_from_ir(original, source_path)
            (
                office_svg_source,
                old_outer_relationship_id,
                old_svg_relationship_id,
                old_outer_media_part,
                old_svg_media_part,
            ) = _with_office_svg_relationship(source_path.read_bytes(), old_svg)
            imported_picture = import_pptx_to_canonical(office_svg_source)[
                "presentation"
            ]["slides"][0]["shapes"][0]["image"]
            self.assertEqual(imported_picture["content_type"], "image/png")
            self.assertEqual(base64.b64decode(imported_picture["data"]), red)

            replacements = (
                ("raster", _image_ir(blue, "image/png"), False, blue),
                ("svg", _image_ir(new_svg, "image/svg+xml", alpha=0.75), True, new_svg),
            )
            for name, replacement_image, expect_svg_extension, expected_media in replacements:
                with self.subTest(replacement=name):
                    desired = copy.deepcopy(original)
                    desired["slides"][0]["shapes"][0]["image"] = replacement_image
                    output_path = Path(temp_dir) / f"replaced-{name}.pptx"
                    write_pptx_from_ir(
                        desired,
                        output_path,
                        source_pptx=office_svg_source,
                        original_ir=original,
                    )

                    with zipfile.ZipFile(output_path) as package:
                        blip = _slide_xml(package).find(
                            f".//{{{P}}}pic/{{{P}}}blipFill/{{{A}}}blip"
                        )
                        replacement_relationship_id = blip.get(f"{{{R}}}embed")
                        self.assertNotIn(
                            replacement_relationship_id,
                            {old_outer_relationship_id, old_svg_relationship_id},
                        )
                        svg_blip = blip.find(
                            f"{{{A}}}extLst/{{{A}}}ext/{{{ASVG}}}svgBlip"
                        )
                        if expect_svg_extension:
                            self.assertIsNotNone(svg_blip)
                            self.assertEqual(
                                svg_blip.get(f"{{{R}}}embed"),
                                replacement_relationship_id,
                            )
                            child_names = [child.tag.rsplit("}", 1)[-1] for child in blip]
                            self.assertLess(
                                child_names.index("alphaModFix"),
                                child_names.index("extLst"),
                            )
                        else:
                            self.assertIsNone(svg_blip)

                        relationship_ids = {
                            relationship.get("Id")
                            for relationship in _slide_rels(package).findall(
                                f"{{{REL}}}Relationship"
                            )
                        }
                        self.assertNotIn(old_outer_relationship_id, relationship_ids)
                        self.assertNotIn(old_svg_relationship_id, relationship_ids)
                        self.assertNotIn(old_outer_media_part, package.namelist())
                        self.assertNotIn(old_svg_media_part, package.namelist())
                        _part, replacement_media = _embedded_media(
                            package,
                            replacement_relationship_id,
                        )
                        self.assertEqual(replacement_media, expected_media)

    def test_source_backed_office_svg_picture_fills_keep_dual_relationships_for_geometry_edits(self) -> None:
        raster = _image_bytes("PNG", (240, 80, 30, 255))
        svg = b'''<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">
<rect width="120" height="80" fill="#ffcc33"/><circle cx="60" cy="40" r="28" fill="#2255dd"/>
</svg>'''
        source_fill = {"type": "picture", "image": _image_ir(raster, "image/png")}
        source_ir = _presentation(
            _auto_shape(copy.deepcopy(source_fill)),
            _table_shape(copy.deepcopy(source_fill)),
            background={"fill": copy.deepcopy(source_fill)},
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "svg-fill-source.pptx"
            output_path = Path(temp_dir) / "svg-fill-cropped.pptx"
            write_pptx_from_ir(source_ir, source_path)
            office_svg_source, relationship_records = _with_office_svg_fill_relationships(
                source_path.read_bytes(),
                svg,
            )

            imported = import_pptx_to_canonical(office_svg_source)["presentation"]
            imported_slide = imported["slides"][0]
            imported_images = (
                imported_slide["background"]["fill"]["image"],
                imported_slide["shapes"][0]["fill"]["image"],
                imported_slide["shapes"][1]["table"]["rows"][0][0]["fill"]["image"],
            )
            for imported_image in imported_images:
                self.assertEqual(imported_image["content_type"], "image/svg+xml")
                self.assertEqual(base64.b64decode(imported_image["data"]), svg)
                self.assertTrue(imported_image["embed_id"].endswith(".svg"))

            desired = copy.deepcopy(imported)
            desired_slide = desired["slides"][0]
            desired_slide["background"]["fill"]["image"]["crop_right"] = 0.11
            desired_slide["shapes"][0]["fill"]["image"]["crop_left"] = 0.22
            desired_slide["shapes"][1]["table"]["rows"][0][0]["fill"]["image"][
                "crop_top"
            ] = 0.33
            write_pptx_from_ir(
                desired,
                output_path,
                source_pptx=office_svg_source,
                original_ir=imported,
            )

            with zipfile.ZipFile(output_path) as package:
                root = _slide_xml(package)
                output_blips = (
                    root.find(
                        f"{{{P}}}cSld/{{{P}}}bg/{{{P}}}bgPr/{{{A}}}blipFill/{{{A}}}blip"
                    ),
                    root.find(f".//{{{P}}}sp/{{{P}}}spPr/{{{A}}}blipFill/{{{A}}}blip"),
                    root.find(f".//{{{A}}}tc/{{{A}}}tcPr/{{{A}}}blipFill/{{{A}}}blip"),
                )
                for blip, (outer_id, svg_id, svg_media_part) in zip(
                    output_blips,
                    relationship_records,
                    strict=True,
                ):
                    self.assertEqual(blip.get(f"{{{R}}}embed"), outer_id)
                    svg_blip = blip.find(
                        f"{{{A}}}extLst/{{{A}}}ext/{{{ASVG}}}svgBlip"
                    )
                    self.assertIsNotNone(svg_blip)
                    self.assertEqual(svg_blip.get(f"{{{R}}}embed"), svg_id)
                    self.assertEqual(package.read(svg_media_part), svg)

                self.assertEqual(
                    root.find(
                        f"{{{P}}}cSld/{{{P}}}bg/{{{P}}}bgPr/{{{A}}}blipFill/{{{A}}}srcRect"
                    ).attrib,
                    {"l": "0", "r": "11000", "t": "0", "b": "0"},
                )
                self.assertEqual(
                    root.find(f".//{{{P}}}sp/{{{P}}}spPr/{{{A}}}blipFill/{{{A}}}srcRect").attrib,
                    {"l": "22000", "r": "0", "t": "0", "b": "0"},
                )
                self.assertEqual(
                    root.find(f".//{{{A}}}tc/{{{A}}}tcPr/{{{A}}}blipFill/{{{A}}}srcRect").attrib,
                    {"l": "0", "r": "0", "t": "33000", "b": "0"},
                )
                image_relationship_ids = {
                    relationship.get("Id")
                    for relationship in _slide_rels(package).findall(
                        f"{{{REL}}}Relationship"
                    )
                    if relationship.get("Type")
                    == "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
                }
                self.assertEqual(
                    image_relationship_ids,
                    {
                        relationship_id
                        for outer_id, svg_id, _part in relationship_records
                        for relationship_id in (outer_id, svg_id)
                    },
                )

    def test_source_backed_new_svg_picture_fill_writes_svg_extension(self) -> None:
        svg = b'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="#0088cc"/></svg>'
        source_ir = _presentation(_auto_shape({"type": "solid", "color": "FFFFFF"}))
        desired_ir = copy.deepcopy(source_ir)
        desired_ir["slides"][0]["shapes"][0]["fill"] = {
            "type": "picture",
            "image": _image_ir(svg, "image/svg+xml", crop_left=0.1),
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "solid-source.pptx"
            output_path = Path(temp_dir) / "new-svg-fill.pptx"
            write_pptx_from_ir(source_ir, source_path)
            write_pptx_from_ir(
                desired_ir,
                output_path,
                source_pptx=source_path.read_bytes(),
                original_ir=source_ir,
            )
            with zipfile.ZipFile(output_path) as package:
                blip = _slide_xml(package).find(
                    f".//{{{P}}}sp/{{{P}}}spPr/{{{A}}}blipFill/{{{A}}}blip"
                )
                relationship_id = blip.get(f"{{{R}}}embed")
                svg_blip = blip.find(
                    f"{{{A}}}extLst/{{{A}}}ext/{{{ASVG}}}svgBlip"
                )
                self.assertIsNotNone(svg_blip)
                self.assertEqual(svg_blip.get(f"{{{R}}}embed"), relationship_id)
                media_part, media = _embedded_media(package, relationship_id)
                self.assertTrue(media_part.endswith(".svg"), media_part)
                self.assertEqual(media, svg)

    def test_negative_stretch_insets_are_preserved_in_both_export_paths(self) -> None:
        image = _image_ir(
            _image_bytes("PNG", (20, 90, 180, 255)),
            "image/png",
            stretch_left=-0.25,
            stretch_top=-0.125,
            stretch_right=1e30,
            stretch_bottom=float("nan"),
        )
        desired = _presentation(_picture(2, "Picture 1", image))
        source_ir = _presentation(
            _picture(
                2,
                "Picture 1",
                _image_ir(_image_bytes("PNG", (20, 90, 180, 255)), "image/png"),
            )
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "source.pptx"
            direct_path = Path(temp_dir) / "direct.pptx"
            roundtrip_path = Path(temp_dir) / "roundtrip.pptx"
            write_pptx_from_ir(source_ir, source_path)
            write_pptx_from_ir(desired, direct_path)
            write_pptx_from_ir(
                desired,
                roundtrip_path,
                source_pptx=source_path.read_bytes(),
                original_ir=source_ir,
            )

            for output_path in (direct_path, roundtrip_path):
                with self.subTest(output=output_path.name), zipfile.ZipFile(output_path) as package:
                    fill_rect = _slide_xml(package).find(
                        f".//{{{P}}}pic/{{{P}}}blipFill/{{{A}}}stretch/{{{A}}}fillRect"
                    )
                    self.assertEqual(
                        fill_rect.attrib,
                        {
                            "l": "-25000",
                            "r": "2147483647",
                            "t": "-12500",
                            "b": "0",
                        },
                    )

            imported = import_pptx_to_canonical(direct_path.read_bytes())
            imported_image = imported["presentation"]["slides"][0]["shapes"][0]["image"]
            self.assertAlmostEqual(imported_image["stretch_left"], -0.25)
            self.assertAlmostEqual(imported_image["stretch_top"], -0.125)
            self.assertAlmostEqual(imported_image["stretch_right"], 21474.83647)
            self.assertEqual(imported_image["stretch_bottom"], 0.0)

    def test_picture_fill_alpha_and_grayscale_effects_match_in_both_export_paths(self) -> None:
        image_bytes = _image_bytes("PNG", (40, 180, 90, 255))
        original_image = _image_ir(
            image_bytes,
            "image/png",
            alpha=0.5,
        )
        image = _image_ir(
            image_bytes,
            "image/png",
            alpha=0.5,
            effects=[{"type": "grayscale"}],
        )
        picture_fill = {"type": "picture", "alpha": 0.4, "image": image}
        solid_fill = {"type": "solid", "color": "F0F0F0"}
        desired_auto_shape = _auto_shape(picture_fill)
        desired_auto_shape["effects"] = [{"type": "grayscale"}]
        desired_picture = _picture(4, "Picture 1", image, left=100)
        desired_picture["effects"] = [{"type": "grayscale"}]
        desired = _presentation(
            desired_auto_shape,
            _table_shape(picture_fill),
            desired_picture,
            background={"fill": picture_fill},
        )
        source_ir = _presentation(
            _auto_shape(solid_fill),
            _table_shape(solid_fill),
            _picture(4, "Picture 1", original_image, left=100),
            background={"fill": solid_fill},
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "source.pptx"
            direct_path = Path(temp_dir) / "direct.pptx"
            roundtrip_path = Path(temp_dir) / "roundtrip.pptx"
            write_pptx_from_ir(source_ir, source_path)
            write_pptx_from_ir(desired, direct_path)
            write_pptx_from_ir(
                desired,
                roundtrip_path,
                source_pptx=source_path.read_bytes(),
                original_ir=source_ir,
            )

            alpha_paths = (
                f".//{{{P}}}sp/{{{P}}}spPr/{{{A}}}blipFill/{{{A}}}blip/{{{A}}}alphaModFix",
                f"{{{P}}}cSld/{{{P}}}bg/{{{P}}}bgPr/{{{A}}}blipFill/{{{A}}}blip/{{{A}}}alphaModFix",
                f".//{{{A}}}tc/{{{A}}}tcPr/{{{A}}}blipFill/{{{A}}}blip/{{{A}}}alphaModFix",
            )
            for output_path in (direct_path, roundtrip_path):
                with self.subTest(output=output_path.name), zipfile.ZipFile(output_path) as package:
                    root = _slide_xml(package)
                    for alpha_path in alpha_paths:
                        alpha = root.find(alpha_path)
                        self.assertIsNotNone(alpha, alpha_path)
                        self.assertEqual(alpha.get("amt"), "20000")
                    blips = root.findall(f".//{{{A}}}blip")
                    self.assertEqual(len(blips), 4)
                    for blip in blips:
                        self.assertEqual(len(blip.findall(f"{{{A}}}grayscl")), 1)

    def test_picture_slide_background_is_written_in_both_export_paths(self) -> None:
        image = _image_ir(
            _image_bytes("PNG", (30, 120, 210, 255)),
            "image/png",
            crop_left=0.08,
            stretch_right=0.16,
            alpha=0.7,
        )
        background = {"fill": {"type": "picture", "image": image}}
        source_ir = _presentation(background={"fill": {"type": "solid", "color": "FFFFFF"}})
        desired_ir = _presentation(background=background)

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "source.pptx"
            direct_path = Path(temp_dir) / "direct.pptx"
            roundtrip_path = Path(temp_dir) / "roundtrip.pptx"
            write_pptx_from_ir(source_ir, source_path)
            write_pptx_from_ir(desired_ir, direct_path)
            write_pptx_from_ir(
                desired_ir,
                roundtrip_path,
                source_pptx=source_path.read_bytes(),
                original_ir=source_ir,
            )

            for output in (direct_path, roundtrip_path):
                with self.subTest(output=output.name), zipfile.ZipFile(output) as package:
                    root = _slide_xml(package)
                    fill = root.find(f"{{{P}}}cSld/{{{P}}}bg/{{{P}}}bgPr/{{{A}}}blipFill")
                    self.assertIsNotNone(fill)
                    self.assertEqual(fill.find(f"{{{A}}}srcRect").attrib, {"l": "8000"})
                    self.assertEqual(
                        fill.find(f"{{{A}}}stretch/{{{A}}}fillRect").attrib,
                        {"r": "16000"},
                    )
                    blip = fill.find(f"{{{A}}}blip")
                    self.assertEqual(blip.find(f"{{{A}}}alphaModFix").get("amt"), "70000")
                    media_part, media = _embedded_media(package, blip.get(f"{{{R}}}embed"))
                    self.assertTrue(media_part.startswith("ppt/media/"))
                    self.assertTrue(media)

    def test_source_backed_picture_fill_precedes_line_and_effect_children(self) -> None:
        source_ir = _presentation(
            _auto_shape({"type": "solid", "color": "F0F0F0"}),
        )
        desired_ir = copy.deepcopy(source_ir)
        desired_ir["slides"][0]["shapes"][0]["fill"] = {
            "type": "picture",
            "image": _image_ir(
                _image_bytes("PNG", (40, 180, 90, 255)),
                "image/png",
                crop_left=0.18,
                stretch_bottom=0.09,
            ),
        }

        with tempfile.TemporaryDirectory() as temp_dir:
            source_path = Path(temp_dir) / "shape-source.pptx"
            output_path = Path(temp_dir) / "shape-picture-fill.pptx"
            write_pptx_from_ir(source_ir, source_path)
            write_pptx_from_ir(
                desired_ir,
                output_path,
                source_pptx=source_path.read_bytes(),
                original_ir=source_ir,
            )

            with zipfile.ZipFile(output_path) as package:
                sp_pr = _slide_xml(package).find(f".//{{{P}}}sp/{{{P}}}spPr")
                child_names = [child.tag.rsplit("}", 1)[-1] for child in list(sp_pr)]
                self.assertLess(child_names.index("blipFill"), child_names.index("ln"))
                self.assertLess(child_names.index("blipFill"), child_names.index("effectLst"))
                self.assertEqual(
                    child_names,
                    ["xfrm", "prstGeom", "blipFill", "ln", "effectLst"],
                )
                blip_fill = sp_pr.find(f"{{{A}}}blipFill")
                self.assertEqual(blip_fill.find(f"{{{A}}}srcRect").attrib, {"l": "18000"})
                self.assertEqual(
                    blip_fill.find(f"{{{A}}}stretch/{{{A}}}fillRect").attrib,
                    {"b": "9000"},
                )


if __name__ == "__main__":
    unittest.main()
