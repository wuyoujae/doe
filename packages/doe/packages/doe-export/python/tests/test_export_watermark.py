from __future__ import annotations

import base64
import io
import os
import posixpath
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET
import modular_patch as mock

from PIL import Image


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.server.export_watermark import (  # noqa: E402
    WATERMARK_HEIGHT_PT,
    WATERMARK_WIDTH_PT,
    apply_pptx_export_watermark,
    export_watermark_badge_png,
    _wordmark_path,
)
from pptx_pipeline import (  # noqa: E402
    _presentation_ir_without_export_watermarks,
    export_ir_to_pptx,
    import_pptx_to_canonical,
)


A = "http://schemas.openxmlformats.org/drawingml/2006/main"
P = "http://schemas.openxmlformats.org/presentationml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL = "http://schemas.openxmlformats.org/package/2006/relationships"
CT = "http://schemas.openxmlformats.org/package/2006/content-types"
MARKER_DESCRIPTION = "yrkie-export-watermark:v1"
MEDIA_PART = "ppt/media/yrkie-export-watermark-v1.png"


def two_slide_presentation() -> dict:
    return {
        "width": 960,
        "height": 540,
        "slides": [
            {
                "index": 0,
                "name": "Watermark contract 1",
                "background": {"fill": {"type": "solid", "color": "FFFFFF"}},
                "shapes": [],
            },
            {
                "index": 1,
                "name": "Watermark contract 2",
                "background": {"fill": {"type": "solid", "color": "111827"}},
                "shapes": [],
            },
        ],
    }


def _package(payload: bytes) -> dict[str, bytes]:
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        return {name: archive.read(name) for name in archive.namelist()}


def _package_bytes(files: dict[str, bytes]) -> bytes:
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            archive.writestr(name, data)
    return output.getvalue()


def _add_second_referenced_master(payload: bytes) -> bytes:
    files = _package(payload)
    first_master = "ppt/slideMasters/slideMaster1.xml"
    second_master = "ppt/slideMasters/slideMaster2.xml"
    files[second_master] = files[first_master]
    files[_rels_part_name(second_master)] = files[_rels_part_name(first_master)]

    presentation = ET.fromstring(files["ppt/presentation.xml"])
    master_list = presentation.find(f"{{{P}}}sldMasterIdLst")
    assert master_list is not None
    ET.SubElement(
        master_list,
        f"{{{P}}}sldMasterId",
        {"id": "2147483650", f"{{{R}}}id": "rId99"},
    )
    files["ppt/presentation.xml"] = ET.tostring(
        presentation,
        encoding="utf-8",
        xml_declaration=True,
    )

    presentation_rels = ET.fromstring(files["ppt/_rels/presentation.xml.rels"])
    ET.SubElement(
        presentation_rels,
        f"{{{REL}}}Relationship",
        {
            "Id": "rId99",
            "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster",
            "Target": "slideMasters/slideMaster2.xml",
        },
    )
    files["ppt/_rels/presentation.xml.rels"] = ET.tostring(
        presentation_rels,
        encoding="utf-8",
        xml_declaration=True,
    )

    content_types = ET.fromstring(files["[Content_Types].xml"])
    ET.SubElement(
        content_types,
        f"{{{CT}}}Override",
        {
            "PartName": "/ppt/slideMasters/slideMaster2.xml",
            "ContentType": "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml",
        },
    )
    files["[Content_Types].xml"] = ET.tostring(
        content_types,
        encoding="utf-8",
        xml_declaration=True,
    )
    return _package_bytes(files)


def _slide_parts(files: dict[str, bytes]) -> list[str]:
    return sorted(
        name
        for name in files
        if name.startswith("ppt/slides/slide")
        and name.endswith(".xml")
        and "/_rels/" not in name
    )


def _master_parts(files: dict[str, bytes]) -> list[str]:
    return sorted(
        name
        for name in files
        if name.startswith("ppt/slideMasters/slideMaster")
        and name.endswith(".xml")
        and "/_rels/" not in name
    )


def _rels_part_name(part_name: str) -> str:
    directory, filename = posixpath.split(part_name)
    return posixpath.join(directory, "_rels", f"{filename}.rels")


def _resolve_target(source_part: str, target: str) -> str:
    return posixpath.normpath(posixpath.join(posixpath.dirname(source_part), target))


def _watermark_pictures(files: dict[str, bytes], part_name: str) -> list[ET.Element]:
    root = ET.fromstring(files[part_name])
    pictures = []
    for picture in root.findall(f".//{{{P}}}pic"):
        properties = picture.find(f"{{{P}}}nvPicPr/{{{P}}}cNvPr")
        if properties is not None and properties.get("descr") == MARKER_DESCRIPTION:
            pictures.append(picture)
    return pictures


def _assert_locked_watermark_picture(
    case: unittest.TestCase,
    files: dict[str, bytes],
    part_name: str,
) -> None:
    pictures = _watermark_pictures(files, part_name)
    case.assertEqual(len(pictures), 1, part_name)
    picture = pictures[0]

    locks = picture.find(f"{{{P}}}nvPicPr/{{{P}}}cNvPicPr/{{{A}}}picLocks")
    case.assertIsNotNone(locks, part_name)
    assert locks is not None
    for attribute in (
        "noSelect",
        "noMove",
        "noResize",
        "noRot",
        "noChangeAspect",
        "noEditPoints",
        "noCrop",
    ):
        case.assertEqual(locks.get(attribute), "1", f"{part_name}: {attribute}")

    blip = picture.find(f"{{{P}}}blipFill/{{{A}}}blip")
    case.assertIsNotNone(blip, part_name)
    assert blip is not None
    relationship_id = blip.get(f"{{{R}}}embed")
    case.assertTrue(relationship_id, part_name)

    rels_name = _rels_part_name(part_name)
    case.assertIn(rels_name, files)
    rels_root = ET.fromstring(files[rels_name])
    relationship = next(
        (
            node
            for node in rels_root.findall(f"{{{REL}}}Relationship")
            if node.get("Id") == relationship_id
        ),
        None,
    )
    case.assertIsNotNone(relationship, f"{part_name}: {relationship_id}")
    assert relationship is not None
    case.assertTrue((relationship.get("Type") or "").endswith("/image"))
    target = relationship.get("Target") or ""
    case.assertEqual(_resolve_target(part_name, target), MEDIA_PART)
    case.assertIn(MEDIA_PART, files)


class ExportWatermarkTests(unittest.TestCase):
    def test_configured_wordmark_path_is_absolute_and_readable(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            wordmark = Path(directory) / "logo-text.webp"
            wordmark.write_bytes(b"approved-wordmark")
            with mock.patch.dict(
                os.environ,
                {"YRKIE_EXPORT_WORDMARK_PATH": str(wordmark)},
            ):
                self.assertEqual(_wordmark_path(), wordmark)

        with mock.patch.dict(
            os.environ,
            {"YRKIE_EXPORT_WORDMARK_PATH": "relative/logo-text.webp"},
        ):
            with self.assertRaisesRegex(RuntimeError, "must be an absolute path"):
                _wordmark_path()

    def test_badge_png_is_a_transparent_capsule_with_label_and_logo(self) -> None:
        payload = export_watermark_badge_png()

        self.assertTrue(payload.startswith(b"\x89PNG\r\n\x1a\n"))
        with Image.open(io.BytesIO(payload)) as image:
            self.assertEqual(image.format, "PNG")
            self.assertEqual(
                image.size,
                (round(WATERMARK_WIDTH_PT * 4), round(WATERMARK_HEIGHT_PT * 4)),
            )
            rgba = image.convert("RGBA")
            self.assertEqual(rgba.getpixel((0, 0))[3], 0)
            self.assertGreater(rgba.getpixel((rgba.width // 2, rgba.height // 2))[3], 240)
            visible = [pixel for pixel in rgba.getdata() if pixel[3] > 200]
            self.assertTrue(
                any(max(pixel[:3]) < 80 for pixel in visible),
                "The badge must contain the black 'made by' label.",
            )
            self.assertTrue(
                any(pixel[2] > pixel[0] + 25 and pixel[2] > pixel[1] + 10 for pixel in visible),
                "The badge must contain the blue Yrkie logo-text wordmark.",
            )

    def test_export_watermark_false_leaves_the_package_unmarked(self) -> None:
        payload = export_ir_to_pptx(two_slide_presentation(), export_watermark=False)
        files = _package(payload)

        self.assertNotIn(MEDIA_PART, files)
        self.assertFalse(
            any(MARKER_DESCRIPTION.encode("utf-8") in data for data in files.values())
        )

    def test_paid_export_removes_legacy_ir_shape_and_orphaned_picture_media(self) -> None:
        presentation = two_slide_presentation()
        presentation["slides"][0]["shapes"] = [
            {
                "type": "picture",
                "name": "Yrkie export watermark",
                "shape_id": 90,
                "bounds": {"left": 836, "top": 498, "width": 108, "height": 28},
                "image": {
                    "content_type": "image/png",
                    "data": base64.b64encode(export_watermark_badge_png()).decode("ascii"),
                },
            }
        ]

        payload = export_ir_to_pptx(presentation, export_watermark=False)
        files = _package(payload)

        self.assertFalse(any(b"Yrkie export watermark" in data for data in files.values()))
        self.assertFalse(any(name.startswith("ppt/media/") for name in files))

    def test_source_free_export_adds_one_locked_master_and_per_slide_picture(self) -> None:
        payload = export_ir_to_pptx(two_slide_presentation(), export_watermark=True)
        files = _package(payload)

        slides = _slide_parts(files)
        masters = _master_parts(files)
        self.assertEqual(len(slides), 2)
        self.assertGreaterEqual(len(masters), 1)
        self.assertEqual(files[MEDIA_PART], export_watermark_badge_png())
        for part_name in [*masters, *slides]:
            _assert_locked_watermark_picture(self, files, part_name)

    def test_every_presentation_referenced_master_receives_the_watermark(self) -> None:
        source = export_ir_to_pptx(two_slide_presentation(), export_watermark=False)
        source = _add_second_referenced_master(source)

        files = _package(apply_pptx_export_watermark(source))

        masters = _master_parts(files)
        self.assertEqual(masters, [
            "ppt/slideMasters/slideMaster1.xml",
            "ppt/slideMasters/slideMaster2.xml",
        ])
        for part_name in masters:
            _assert_locked_watermark_picture(self, files, part_name)

    def test_pptx_watermark_injection_is_idempotent(self) -> None:
        original = export_ir_to_pptx(two_slide_presentation(), export_watermark=False)
        once = apply_pptx_export_watermark(original)
        twice = apply_pptx_export_watermark(once)
        files = _package(twice)

        for part_name in [*_master_parts(files), *_slide_parts(files)]:
            _assert_locked_watermark_picture(self, files, part_name)
            rels_root = ET.fromstring(files[_rels_part_name(part_name)])
            watermark_relationships = [
                relationship
                for relationship in rels_root.findall(f"{{{REL}}}Relationship")
                if relationship.get("Target")
                and _resolve_target(part_name, relationship.get("Target") or "") == MEDIA_PART
            ]
            self.assertEqual(len(watermark_relationships), 1, part_name)
        self.assertEqual(sum(name == MEDIA_PART for name in files), 1)

    def test_source_backed_export_keeps_watermark_out_of_ir_and_on_master_and_slides(self) -> None:
        presentation = two_slide_presentation()
        source = export_ir_to_pptx(presentation, export_watermark=False)

        payload = export_ir_to_pptx(
            presentation,
            source_pptx=source,
            original_ir=presentation,
            export_watermark=True,
        )
        files = _package(payload)

        self.assertNotIn("watermark", presentation)
        self.assertTrue(all("watermark" not in slide for slide in presentation["slides"]))
        for part_name in [*_master_parts(files), *_slide_parts(files)]:
            _assert_locked_watermark_picture(self, files, part_name)

    def test_paid_source_backed_export_removes_a_previous_prelude_watermark(self) -> None:
        presentation = two_slide_presentation()
        prelude_source = export_ir_to_pptx(presentation, export_watermark=True)
        reimported = import_pptx_to_canonical(prelude_source)["presentation"]

        payload = export_ir_to_pptx(
            reimported,
            source_pptx=prelude_source,
            original_ir=reimported,
            export_watermark=False,
        )
        files = _package(payload)

        self.assertNotIn(MEDIA_PART, files)
        self.assertFalse(
            any(MARKER_DESCRIPTION.encode("utf-8") in data for data in files.values())
        )

    def test_reimported_prelude_markers_are_filtered_before_static_rendering(self) -> None:
        prelude_export = export_ir_to_pptx(
            two_slide_presentation(),
            export_watermark=True,
        )
        reimported = import_pptx_to_canonical(prelude_export)["presentation"]
        marker_name = "yrkie export watermark"
        imported_markers = [
            shape
            for slide in reimported["slides"]
            for shape in slide["shapes"]
            if (shape.get("name") or "").strip().casefold() == marker_name
        ]

        cleaned = _presentation_ir_without_export_watermarks(reimported)
        cleaned_markers = [
            shape
            for slide in cleaned["slides"]
            for shape in slide["shapes"]
            if (shape.get("name") or "").strip().casefold() == marker_name
        ]

        self.assertGreaterEqual(len(imported_markers), len(reimported["slides"]))
        self.assertEqual(cleaned_markers, [])


if __name__ == "__main__":
    unittest.main()
