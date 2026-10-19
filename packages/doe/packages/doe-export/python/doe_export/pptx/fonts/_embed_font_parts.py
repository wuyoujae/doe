# Origin: schema_v4_fonts.py::_embed_font_parts
from __future__ import annotations
from .shared import BytesIO, CONTENT_TYPES_NS, FONT_CONTENT_TYPE, FONT_RELATIONSHIP_TYPE, OFFICE_REL_NS, PACKAGE_REL_NS, PML_NS, PreparedFontFace, ZIP_DEFLATED, ZipFile, etree
from ._insert_embedded_font_list import _insert_embedded_font_list
from ._next_number import _next_number
from ._relationship_target_part import _relationship_target_part

def _embed_font_parts(pptx_bytes: bytes, fonts: list[PreparedFontFace]) -> bytes:
    if not fonts:
        return pptx_bytes
    source_stream = BytesIO(pptx_bytes)
    output_stream = BytesIO()
    with ZipFile(source_stream, "r") as source:
        infos = source.infolist()
        names = [item.filename for item in infos]
        if len(names) != len(set(names)):
            raise ValueError("PPTX contains duplicate ZIP part names.")
        required = {
            "[Content_Types].xml",
            "ppt/presentation.xml",
            "ppt/_rels/presentation.xml.rels",
        }
        if missing := sorted(required.difference(names)):
            raise ValueError(f"PPTX is missing required parts: {', '.join(missing)}")
        presentation_root = etree.fromstring(source.read("ppt/presentation.xml"))
        relationships_root = etree.fromstring(
            source.read("ppt/_rels/presentation.xml.rels")
        )
        content_types_root = etree.fromstring(source.read("[Content_Types].xml"))
        embedded_list = presentation_root.find(f"{{{PML_NS}}}embeddedFontLst")
        if embedded_list is None:
            embedded_list = etree.Element(f"{{{PML_NS}}}embeddedFontLst")
            _insert_embedded_font_list(presentation_root, embedded_list)
        presentation_root.set("embedTrueTypeFonts", "1")
        presentation_root.set("saveSubsetFonts", "1")

        relationships = relationships_root.findall(
            f"{{{PACKAGE_REL_NS}}}Relationship"
        )
        relationship_by_id = {
            item.get("Id"): item for item in relationships if item.get("Id")
        }
        used_relationship_ids = set(relationship_by_id)
        used_part_names = set(names)
        next_relationship_number = _next_number(used_relationship_ids, r"rId(\d+)")
        next_font_number = _next_number(
            used_part_names, r"ppt/fonts/font(\d+)\.fntdata"
        )
        new_parts: dict[str, bytes] = {}
        replacement_parts: dict[str, bytes] = {}
        family_entries: dict[str, Any] = {}
        for entry in embedded_list.findall(f"{{{PML_NS}}}embeddedFont"):
            font_element = entry.find(f"{{{PML_NS}}}font")
            typeface = font_element.get("typeface") if font_element is not None else None
            if typeface:
                family_entries.setdefault(typeface.casefold(), entry)

        for font in fonts:
            entry = family_entries.get(font.family.casefold())
            if entry is None:
                entry = etree.SubElement(embedded_list, f"{{{PML_NS}}}embeddedFont")
                font_element = etree.SubElement(entry, f"{{{PML_NS}}}font")
                font_element.set("typeface", font.family)
                font_element.set("charset", "1")
                if font.panose and font.panose != "00" * 10:
                    font_element.set("panose", font.panose)
                family_entries[font.family.casefold()] = entry
            slot_element = entry.find(f"{{{PML_NS}}}{font.slot}")
            part_name = None
            if slot_element is not None:
                relationship_id = slot_element.get(f"{{{OFFICE_REL_NS}}}id")
                relationship = relationship_by_id.get(relationship_id)
                if relationship is not None and relationship.get("TargetMode", "Internal") == "Internal":
                    part_name = _relationship_target_part(relationship.get("Target"))
                    if part_name not in used_part_names:
                        part_name = None
            else:
                slot_element = etree.SubElement(entry, f"{{{PML_NS}}}{font.slot}")
            if part_name is None:
                while True:
                    part_name = f"ppt/fonts/font{next_font_number}.fntdata"
                    next_font_number += 1
                    if part_name not in used_part_names and part_name not in new_parts:
                        break
                while f"rId{next_relationship_number}" in used_relationship_ids:
                    next_relationship_number += 1
                relationship_id = f"rId{next_relationship_number}"
                next_relationship_number += 1
                used_relationship_ids.add(relationship_id)
                relationship = etree.SubElement(
                    relationships_root,
                    f"{{{PACKAGE_REL_NS}}}Relationship",
                )
                relationship.set("Id", relationship_id)
                relationship.set("Type", FONT_RELATIONSHIP_TYPE)
                relationship.set("Target", part_name.removeprefix("ppt/"))
                relationship_by_id[relationship_id] = relationship
                slot_element.set(f"{{{OFFICE_REL_NS}}}id", relationship_id)
                new_parts[part_name] = font.font_part_bytes
                used_part_names.add(part_name)
            else:
                replacement_parts[part_name] = font.font_part_bytes

        defaults = content_types_root.findall(f"{{{CONTENT_TYPES_NS}}}Default")
        font_defaults = [
            item
            for item in defaults
            if (item.get("Extension") or "").casefold() == "fntdata"
        ]
        if len(font_defaults) > 1:
            raise ValueError("PPTX has duplicate fntdata content type defaults.")
        if font_defaults:
            font_defaults[0].set("ContentType", FONT_CONTENT_TYPE)
        else:
            default = etree.SubElement(
                content_types_root, f"{{{CONTENT_TYPES_NS}}}Default"
            )
            default.set("Extension", "fntdata")
            default.set("ContentType", FONT_CONTENT_TYPE)
        modified = {
            "ppt/presentation.xml": etree.tostring(
                presentation_root,
                xml_declaration=True,
                encoding="UTF-8",
                standalone=True,
            ),
            "ppt/_rels/presentation.xml.rels": etree.tostring(
                relationships_root,
                xml_declaration=True,
                encoding="UTF-8",
                standalone=True,
            ),
            "[Content_Types].xml": etree.tostring(
                content_types_root,
                xml_declaration=True,
                encoding="UTF-8",
                standalone=True,
            ),
            **replacement_parts,
        }
        with ZipFile(output_stream, "w", ZIP_DEFLATED) as output:
            for item in infos:
                output.writestr(item, modified.get(item.filename, source.read(item.filename)))
            for part_name, payload in new_parts.items():
                output.writestr(part_name, payload, compress_type=ZIP_DEFLATED)
    result = output_stream.getvalue()
    with ZipFile(BytesIO(result), "r") as verification:
        if bad_part := verification.testzip():
            raise ValueError(f"Font-embedded PPTX failed CRC at {bad_part}.")
    return result

_embed_font_parts.__module__ = 'schema_v4_fonts'
