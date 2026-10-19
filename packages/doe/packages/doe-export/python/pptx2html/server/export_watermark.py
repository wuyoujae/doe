"""Branded export watermark shared by PPTX, PDF, and PNG output.

The application deliberately keeps this watermark outside PresentationIR.  It
is an export entitlement, not editable slide content.  PPTX output receives a
copy on every referenced slide master and a locked, same-position slide copy.
The latter is required because PowerPoint always paints ordinary slide shapes
above master shapes and can hide master graphics entirely.
"""

from __future__ import annotations

import base64
import io
import os
import posixpath
import zipfile
from functools import lru_cache
from pathlib import Path
import xml.etree.ElementTree as ET

from PIL import Image, ImageDraw, ImageFont
from pptx2html.ooxml.safe_xml import parse_xml
from pptx2html.opc.archive_guard import read_archive_entry, validate_pptx_archive

from .ooxml_pptx_writer import (
    A,
    EMU_PER_PT,
    IMAGE_REL_TYPE,
    P,
    R,
    REL,
    OoxmlPackage,
    join_part_target,
    next_relationship_id,
    parse_relationships,
    qn,
    relative_target,
    rels_part_name,
    xml_bytes,
)


WATERMARK_WIDTH_PT = 108.0
WATERMARK_HEIGHT_PT = 28.0
WATERMARK_RIGHT_PT = 16.0
WATERMARK_BOTTOM_PT = 14.0

_BADGE_SCALE = 4
_MARKER_NAME = "Yrkie Export Watermark"
_MARKER_DESCRIPTION = "yrkie-export-watermark:v1"
_MEDIA_PART = "ppt/media/yrkie-export-watermark-v1.png"
_SLIDE_MASTER_REL_TYPE = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster"
)
_WORDMARK_PATH_ENV = "YRKIE_EXPORT_WORDMARK_PATH"


@lru_cache(maxsize=1)
def export_watermark_badge_png() -> bytes:
    """Render the official wordmark and label into a stable transparent PNG."""

    width = round(WATERMARK_WIDTH_PT * _BADGE_SCALE)
    height = round(WATERMARK_HEIGHT_PT * _BADGE_SCALE)
    badge = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(badge)
    border_width = max(1, round(0.6 * _BADGE_SCALE))
    inset = border_width // 2
    draw.rounded_rectangle(
        (inset, inset, width - inset - 1, height - inset - 1),
        radius=height // 2,
        fill=(255, 255, 255, 255),
        outline=(220, 224, 230, 255),
        width=border_width,
    )

    font = _watermark_font(round(9.25 * _BADGE_SCALE))
    label = "made by"
    label_box = draw.textbbox((0, 0), label, font=font)
    label_width = label_box[2] - label_box[0]
    label_height = label_box[3] - label_box[1]

    with Image.open(_wordmark_path()) as source:
        wordmark = source.convert("RGBA")
    alpha_box = wordmark.getchannel("A").getbbox()
    if alpha_box is None:
        raise RuntimeError("The Yrkie logo-text asset has no visible pixels.")
    wordmark = wordmark.crop(alpha_box)
    logo_height = round(14.5 * _BADGE_SCALE)
    logo_width = round(logo_height * wordmark.width / max(1, wordmark.height))
    resampling = getattr(Image, "Resampling", Image).LANCZOS
    wordmark = wordmark.resize((logo_width, logo_height), resampling)

    gap = round(5.5 * _BADGE_SCALE)
    content_width = label_width + gap + logo_width
    label_x = (width - content_width) // 2
    label_y = (height - label_height) // 2 - label_box[1]
    draw.text((label_x, label_y), label, fill=(17, 17, 17, 255), font=font)
    logo_x = label_x + label_width + gap
    logo_y = (height - logo_height) // 2
    badge.alpha_composite(wordmark, (logo_x, logo_y))

    output = io.BytesIO()
    badge.save(output, format="PNG", optimize=True)
    return output.getvalue()


@lru_cache(maxsize=1)
def export_watermark_data_uri() -> str:
    encoded = base64.b64encode(export_watermark_badge_png()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def apply_pptx_export_watermark(pptx_bytes: bytes) -> bytes:
    """Inject an idempotent, non-IR Yrkie watermark into a PPTX package.

    Master copies satisfy the PowerPoint master-layer contract.  Locked slide
    copies sit at the same coordinates and guarantee visibility above full-page
    pictures or when a slide has ``showMasterSp=0``.  Since the PNG is opaque
    inside its capsule, the two perfectly overlapping copies still render as a
    single badge.
    """

    if not isinstance(pptx_bytes, bytes) or not pptx_bytes.startswith(b"PK"):
        raise ValueError("A valid PPTX OOXML package is required for watermarking.")

    package = OoxmlPackage(pptx_bytes)
    _remove_watermark_artifacts(package)
    slide_width, slide_height = _slide_size(package)
    x, y, cx, cy = _watermark_bounds(slide_width, slide_height)
    badge = export_watermark_badge_png()
    package.files[_MEDIA_PART] = badge
    content_types_xml = package.files.get("[Content_Types].xml")
    package.ensure_content_type(_MEDIA_PART, "image/png")

    master_parts = _referenced_master_parts(package)
    if not master_parts:
        raise ValueError("PPTX package contains no referenced slide master for watermarking.")

    for part_name in [*master_parts, *package.slide_parts()]:
        _inject_locked_picture(package, part_name, x=x, y=y, cx=cx, cy=cy)

    package.files["[Content_Types].xml"] = xml_bytes(
        package.content_types_root,
        namespace_source=content_types_xml,
    )
    return _package_bytes(package.files)


def remove_pptx_export_watermark(pptx_bytes: bytes) -> bytes:
    """Remove Yrkie-generated watermark artifacts for a clean paid export.

    This matters when a user upgrades and then source-backs an export with a
    PPTX that was previously produced under Prelude.  Unknown source OOXML is
    normally preserved, so the entitlement boundary must explicitly remove our
    own stable marker.
    """

    if not isinstance(pptx_bytes, bytes) or not pptx_bytes.startswith(b"PK"):
        raise ValueError("A valid PPTX OOXML package is required for watermark cleanup.")
    if not _pptx_may_have_export_watermark(pptx_bytes):
        return pptx_bytes
    package = OoxmlPackage(pptx_bytes)
    if not _remove_watermark_artifacts(package):
        return pptx_bytes
    return _package_bytes(package.files)


def _pptx_may_have_export_watermark(pptx_bytes: bytes) -> bool:
    marker_name = _MARKER_NAME.casefold().encode("utf-8")
    marker_description = _MARKER_DESCRIPTION.encode("utf-8")
    with zipfile.ZipFile(io.BytesIO(pptx_bytes), "r") as archive:
        entries = validate_pptx_archive(archive)
        names = set(entries)
        if _MEDIA_PART in names:
            return True
        for name in names:
            if (
                not name.endswith(".xml")
                or "/_rels/" in name
                or not name.startswith(
                    (
                        "ppt/slides/slide",
                        "ppt/slideMasters/slideMaster",
                        "ppt/slideLayouts/slideLayout",
                    )
                )
            ):
                continue
            source = read_archive_entry(archive, entries[name], max_bytes=16 * 1024 * 1024).lower()
            if marker_name in source or marker_description in source:
                return True
    return False


def _wordmark_path() -> Path:
    package_root = Path(__file__).resolve().parents[2]
    packaged_wordmark = package_root / "resources" / "static" / "logo-text.webp"
    if packaged_wordmark.is_file():
        return packaged_wordmark

    configured_path = os.getenv(_WORDMARK_PATH_ENV, "").strip()
    if configured_path:
        candidate = Path(configured_path)
        if not candidate.is_absolute():
            raise RuntimeError(f"{_WORDMARK_PATH_ENV} must be an absolute path.")
        if not candidate.is_file():
            raise RuntimeError(
                f"The configured Yrkie logo-text asset is missing: {candidate}"
            )
        return candidate

    candidates = (
        package_root / "resources" / "brand" / "logo-text.webp",
    )
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise RuntimeError("The official Yrkie logo-text asset is missing.")


def _watermark_font(size: int):
    candidates = (
        Path("C:/Windows/Fonts/segoeuib.ttf"),
        Path("C:/Windows/Fonts/segoeui.ttf"),
        Path("/System/Library/Fonts/SFNS.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    )
    for candidate in candidates:
        if candidate.is_file():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


def _slide_size(package: OoxmlPackage) -> tuple[int, int]:
    presentation_xml = package.files.get("ppt/presentation.xml")
    if not presentation_xml:
        raise ValueError("PPTX package is missing ppt/presentation.xml.")
    root = parse_xml(presentation_xml)
    size = root.find(f"{{{P}}}sldSz")
    fallback = (round(960 * EMU_PER_PT), round(540 * EMU_PER_PT))
    if size is None:
        return fallback
    try:
        width = int(size.get("cx") or fallback[0])
        height = int(size.get("cy") or fallback[1])
    except ValueError:
        return fallback
    return (max(1, width), max(1, height))


def _watermark_bounds(slide_width: int, slide_height: int) -> tuple[int, int, int, int]:
    width = round(WATERMARK_WIDTH_PT * EMU_PER_PT)
    height = round(WATERMARK_HEIGHT_PT * EMU_PER_PT)
    right = round(WATERMARK_RIGHT_PT * EMU_PER_PT)
    bottom = round(WATERMARK_BOTTOM_PT * EMU_PER_PT)
    available_width = max(1, slide_width - (2 * right))
    available_height = max(1, slide_height - (2 * bottom))
    scale = min(1.0, available_width / width, available_height / height)
    width = max(1, round(width * scale))
    height = max(1, round(height * scale))
    return (
        max(0, slide_width - right - width),
        max(0, slide_height - bottom - height),
        width,
        height,
    )


def _referenced_master_parts(package: OoxmlPackage) -> list[str]:
    source_part = "ppt/presentation.xml"
    rels = parse_relationships(package.files.get(rels_part_name(source_part)))
    target_by_id = {
        relationship.get("Id"): relationship.get("Target")
        for relationship in rels.findall(f"{{{REL}}}Relationship")
        if relationship.get("Type") == _SLIDE_MASTER_REL_TYPE
    }
    parts: list[str] = []
    presentation_xml = package.files.get(source_part)
    presentation = parse_xml(presentation_xml) if presentation_xml else None
    master_ids = (
        presentation.findall(f".//{{{P}}}sldMasterId")
        if presentation is not None
        else []
    )
    for master_id in master_ids:
        target = target_by_id.get(master_id.get(qn(R, "id")))
        if not target:
            continue
        part = join_part_target(source_part, target)
        if part in package.files and part not in parts:
            parts.append(part)
    if parts:
        return parts
    for target in target_by_id.values():
        if not target:
            continue
        part = join_part_target(source_part, target)
        if part in package.files and part not in parts:
            parts.append(part)
    if parts:
        return parts
    return sorted(
        name
        for name in package.files
        if name.startswith("ppt/slideMasters/slideMaster") and name.endswith(".xml")
    )


def _inject_locked_picture(
    package: OoxmlPackage,
    part_name: str,
    *,
    x: int,
    y: int,
    cx: int,
    cy: int,
) -> None:
    source_xml = package.files.get(part_name)
    if not source_xml:
        raise ValueError(f"PPTX watermark target is missing: {part_name}")
    root = parse_xml(source_xml)
    shape_tree = root.find(f"{{{P}}}cSld/{{{P}}}spTree")
    if shape_tree is None:
        raise ValueError(f"PPTX watermark target has no shape tree: {part_name}")

    _remove_existing_watermarks(shape_tree)
    shape_id = max(
        (
            int(node.get("id"))
            for node in shape_tree.findall(f".//{{{P}}}cNvPr")
            if (node.get("id") or "").isdigit()
        ),
        default=0,
    ) + 1

    rels_name = rels_part_name(part_name)
    rels_xml = package.files.get(rels_name)
    rels_root = parse_relationships(rels_xml)
    relationship_id = _ensure_image_relationship(rels_root, part_name)
    picture = _build_locked_picture(
        shape_id=shape_id,
        relationship_id=relationship_id,
        x=x,
        y=y,
        cx=cx,
        cy=cy,
    )
    _append_before_ext_list(shape_tree, picture)

    package.files[part_name] = xml_bytes(root, namespace_source=source_xml)
    package.files[rels_name] = xml_bytes(rels_root, namespace_source=rels_xml)


def _remove_existing_watermarks(shape_tree: ET.Element) -> tuple[bool, set[str]]:
    changed = False
    relationship_ids: set[str] = set()
    for child in list(shape_tree):
        marker = child.find(f".//{{{P}}}cNvPr")
        if marker is None:
            continue
        normalized_name = (marker.get("name") or "").strip().casefold()
        if (
            marker.get("descr") == _MARKER_DESCRIPTION
            or normalized_name == _MARKER_NAME.casefold()
        ):
            for blip in child.findall(f".//{{{A}}}blip"):
                relationship_id = blip.get(qn(R, "embed"))
                if relationship_id:
                    relationship_ids.add(relationship_id)
            shape_tree.remove(child)
            changed = True
    return changed, relationship_ids


def _remove_watermark_artifacts(package: OoxmlPackage) -> bool:
    changed = False
    candidate_media_parts = {_MEDIA_PART}
    drawing_parts = sorted(
        name
        for name in package.files
        if name.endswith(".xml")
        and name.startswith(("ppt/slides/slide", "ppt/slideMasters/slideMaster", "ppt/slideLayouts/slideLayout"))
        and "/_rels/" not in name
    )
    for part_name in drawing_parts:
        source_xml = package.files.get(part_name)
        if not source_xml:
            continue
        root = parse_xml(source_xml)
        shape_tree = root.find(f"{{{P}}}cSld/{{{P}}}spTree")
        removed_relationship_ids: set[str] = set()
        if shape_tree is not None:
            removed_shapes, removed_relationship_ids = _remove_existing_watermarks(shape_tree)
        else:
            removed_shapes = False
        if removed_shapes:
            package.files[part_name] = xml_bytes(root, namespace_source=source_xml)
            changed = True

        rels_name = rels_part_name(part_name)
        rels_xml = package.files.get(rels_name)
        if not rels_xml:
            continue
        rels_root = parse_relationships(rels_xml)
        removed_relationship = False
        remaining_relationship_ids = {
            relationship_id
            for blip in root.findall(f".//{{{A}}}blip")
            if (relationship_id := blip.get(qn(R, "embed")))
        }
        for relationship in list(rels_root.findall(f"{{{REL}}}Relationship")):
            target = relationship.get("Target")
            target_part = join_part_target(part_name, target) if target else None
            if (
                target
                and relationship.get("Type") == IMAGE_REL_TYPE
                and (
                    target_part == _MEDIA_PART
                    or (
                        relationship.get("Id") in removed_relationship_ids
                        and relationship.get("Id") not in remaining_relationship_ids
                    )
                )
            ):
                if target_part and target_part.startswith("ppt/media/"):
                    candidate_media_parts.add(target_part)
                rels_root.remove(relationship)
                removed_relationship = True
        if removed_relationship:
            package.files[rels_name] = xml_bytes(rels_root, namespace_source=rels_xml)
            changed = True

    for media_part in candidate_media_parts:
        if media_part in package.files and not _part_has_relationship(package.files, media_part):
            del package.files[media_part]
            changed = True
    return changed


def _part_has_relationship(files: dict[str, bytes], target_part: str) -> bool:
    for rels_name, rels_xml in files.items():
        source_part = _source_part_for_relationships(rels_name)
        if source_part is None:
            continue
        rels_root = parse_relationships(rels_xml)
        for relationship in rels_root.findall(f"{{{REL}}}Relationship"):
            target = relationship.get("Target")
            if target and join_part_target(source_part, target) == target_part:
                return True
    return False


def _source_part_for_relationships(rels_name: str) -> str | None:
    if not rels_name.endswith(".rels") or "/_rels/" not in rels_name:
        return None
    directory, filename = posixpath.split(rels_name)
    source_directory = posixpath.dirname(directory)
    source_filename = filename.removesuffix(".rels")
    return posixpath.join(source_directory, source_filename)


def _ensure_image_relationship(rels_root: ET.Element, source_part: str) -> str:
    for relationship in rels_root.findall(f"{{{REL}}}Relationship"):
        target = relationship.get("Target")
        if (
            relationship.get("Type") == IMAGE_REL_TYPE
            and target
            and join_part_target(source_part, target) == _MEDIA_PART
        ):
            return relationship.get("Id") or ""

    relationship_id = next_relationship_id(rels_root)
    ET.SubElement(
        rels_root,
        qn(REL, "Relationship"),
        {
            "Id": relationship_id,
            "Type": IMAGE_REL_TYPE,
            "Target": relative_target(posixpath.dirname(source_part), _MEDIA_PART),
        },
    )
    return relationship_id


def _build_locked_picture(
    *,
    shape_id: int,
    relationship_id: str,
    x: int,
    y: int,
    cx: int,
    cy: int,
) -> ET.Element:
    picture = ET.Element(qn(P, "pic"))
    non_visual = ET.SubElement(picture, qn(P, "nvPicPr"))
    ET.SubElement(
        non_visual,
        qn(P, "cNvPr"),
        {
            "id": str(shape_id),
            "name": _MARKER_NAME,
            "descr": _MARKER_DESCRIPTION,
            "title": "made by yrkie",
        },
    )
    picture_properties = ET.SubElement(
        non_visual,
        qn(P, "cNvPicPr"),
        {"preferRelativeResize": "0"},
    )
    ET.SubElement(
        picture_properties,
        qn(A, "picLocks"),
        {
            "noGrp": "1",
            "noSelect": "1",
            "noRot": "1",
            "noChangeAspect": "1",
            "noMove": "1",
            "noResize": "1",
            "noEditPoints": "1",
            "noAdjustHandles": "1",
            "noChangeShapeType": "1",
            "noCrop": "1",
        },
    )
    ET.SubElement(non_visual, qn(P, "nvPr"))

    blip_fill = ET.SubElement(picture, qn(P, "blipFill"))
    ET.SubElement(blip_fill, qn(A, "blip"), {qn(R, "embed"): relationship_id})
    stretch = ET.SubElement(blip_fill, qn(A, "stretch"))
    ET.SubElement(stretch, qn(A, "fillRect"))

    shape_properties = ET.SubElement(picture, qn(P, "spPr"), {"bwMode": "auto"})
    transform = ET.SubElement(shape_properties, qn(A, "xfrm"))
    ET.SubElement(transform, qn(A, "off"), {"x": str(x), "y": str(y)})
    ET.SubElement(transform, qn(A, "ext"), {"cx": str(cx), "cy": str(cy)})
    geometry = ET.SubElement(shape_properties, qn(A, "prstGeom"), {"prst": "rect"})
    ET.SubElement(geometry, qn(A, "avLst"))
    line = ET.SubElement(shape_properties, qn(A, "ln"))
    ET.SubElement(line, qn(A, "noFill"))
    return picture


def _append_before_ext_list(shape_tree: ET.Element, picture: ET.Element) -> None:
    for index, child in enumerate(list(shape_tree)):
        if child.tag == qn(P, "extLst"):
            shape_tree.insert(index, picture)
            return
    shape_tree.append(picture)


def _package_bytes(files: dict[str, bytes]) -> bytes:
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in files.items():
            archive.writestr(name, data)
    return output.getvalue()


__all__ = [
    "WATERMARK_BOTTOM_PT",
    "WATERMARK_HEIGHT_PT",
    "WATERMARK_RIGHT_PT",
    "WATERMARK_WIDTH_PT",
    "apply_pptx_export_watermark",
    "export_watermark_badge_png",
    "export_watermark_data_uri",
    "remove_pptx_export_watermark",
]
