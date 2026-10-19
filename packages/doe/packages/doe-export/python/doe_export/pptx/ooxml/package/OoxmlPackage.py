# Origin: pptx2html/server/ooxml_pptx_writer.py::OoxmlPackage
from __future__ import annotations
from doe_export.pptx.ooxml.shared import CT, ET, IMAGE_REL_TYPE, NOTES_SLIDE_REL_TYPE, P, Path, R, REL, SLIDE_REL_TYPE, copy, io, parse_xml, posixpath, re, read_archive_entry, validate_pptx_archive, zipfile
from doe_export.pptx.ooxml.package.RoundtripFallbackRequired import RoundtripFallbackRequired
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shape.build_shape_element import build_shape_element
from doe_export.pptx.ooxml.shape.find_matching_original_shape import find_matching_original_shape
from doe_export.pptx.ooxml.assets.image_extension import image_extension
from doe_export.pptx.ooxml.shape.is_shape_element import is_shape_element
from doe_export.pptx.ooxml.xml.join_part_target import join_part_target
from doe_export.pptx.ooxml.shape.map_original_shapes_to_elements import map_original_shapes_to_elements
from doe_export.pptx.ooxml.package.next_relationship_id import next_relationship_id
from doe_export.pptx.ooxml.package.parse_relationships import parse_relationships
from doe_export.pptx.ooxml.shape.patch_shape_element import patch_shape_element
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.package.register_source_namespaces import register_source_namespaces
from doe_export.pptx.ooxml.package.relationship_ids_in_xml import relationship_ids_in_xml
from doe_export.pptx.ooxml.xml.relative_target import relative_target
from doe_export.pptx.ooxml.xml.rels_part_name import rels_part_name
from doe_export.pptx.ooxml.xml.remove_children import remove_children
from doe_export.pptx.ooxml.shape.shape_changed import shape_changed
from doe_export.pptx.ooxml.shape.shape_ids_from_elements import shape_ids_from_elements
from doe_export.pptx.ooxml.shape.shape_ids_from_ir import shape_ids_from_ir
from doe_export.pptx.ooxml.package.source_part_name_from_rels import source_part_name_from_rels
from doe_export.pptx.ooxml.shape.split_shape_tree_children import split_shape_tree_children
from doe_export.pptx.ooxml.xml.write_slide_background import write_slide_background
from doe_export.pptx.ooxml.xml.write_slide_transition import write_slide_transition
from doe_export.pptx.ooxml.xml.xml_bytes import xml_bytes

class OoxmlPackage:
    def __init__(self, source_pptx: bytes):
        with zipfile.ZipFile(io.BytesIO(source_pptx), "r") as zin:
            entries = validate_pptx_archive(zin)
            self.files = {
                name: read_archive_entry(zin, info)
                for name, info in entries.items()
                if not info.is_dir()
            }
        register_source_namespaces(self.files.values())

        if "[Content_Types].xml" not in self.files:
            raise ValueError("Source PPTX is missing [Content_Types].xml")
        self.content_types_root = parse_xml(self.files["[Content_Types].xml"])
        self.orphan_media_candidates: set[str] = set()

    def slide_parts(self) -> list[str]:
        presentation = parse_xml(self.files["ppt/presentation.xml"])
        rels = parse_relationships(self.files.get("ppt/_rels/presentation.xml.rels"))
        rels_by_id = {rel.get("Id"): rel.get("Target") for rel in rels}
        parts: list[str] = []
        for sld_id in presentation.findall(f".//{{{P}}}sldId"):
            r_id = sld_id.get(qn(R, "id"))
            target = rels_by_id.get(r_id)
            if target:
                parts.append(join_part_target("ppt/presentation.xml", target))
        return parts

    def prepare_slide_parts(
        self, source_indexes: list[int | None]
    ) -> list[tuple[str, int | None]]:
        presentation_xml = self.files["ppt/presentation.xml"]
        presentation = parse_xml(presentation_xml)
        rels_name = "ppt/_rels/presentation.xml.rels"
        rels_xml = self.files.get(rels_name)
        rels = parse_relationships(rels_xml)
        rels_by_id = {rel.get("Id"): rel for rel in rels}
        slide_id_list = presentation.find(f"{{{P}}}sldIdLst")
        if slide_id_list is None:
            raise ValueError("Source PPTX is missing its slide id list")

        source_entries: list[tuple[str, ET.Element]] = []
        for slide_id in slide_id_list.findall(f"{{{P}}}sldId"):
            relationship = rels_by_id.get(slide_id.get(qn(R, "id")))
            if relationship is None or relationship.get("Type") != SLIDE_REL_TYPE:
                continue
            target = relationship.get("Target")
            if target:
                source_entries.append(
                    (
                        join_part_target("ppt/presentation.xml", target),
                        copy.deepcopy(slide_id),
                    )
                )
        if not source_entries and source_indexes:
            raise ValueError("Source PPTX contains no usable slides")

        normalized_indexes: list[int | None] = []
        used_indexes: set[int] = set()
        for source_index in source_indexes:
            if source_index is None:
                normalized_indexes.append(None)
                continue
            if not isinstance(source_index, int) or isinstance(source_index, bool):
                raise ValueError("Slide source provenance must be an integer")
            if source_index < 0 or source_index >= len(source_entries):
                raise ValueError("Slide source provenance is outside the imported deck")
            if source_index in used_indexes:
                raise ValueError("Imported source slides cannot be duplicated during export")
            used_indexes.add(source_index)
            normalized_indexes.append(source_index)

        if normalized_indexes == list(range(len(source_entries))):
            return [
                (source_part, source_index)
                for source_index, (source_part, _slide_id) in enumerate(source_entries)
            ]

        next_slide_id = max(
            (
                int(slide_id.get("id"))
                for slide_id in slide_id_list.findall(f"{{{P}}}sldId")
                if (slide_id.get("id") or "").isdigit()
            ),
            default=255,
        ) + 1
        desired: list[tuple[str, int | None, ET.Element]] = []
        for position, source_index in enumerate(normalized_indexes):
            if source_index is not None:
                source_part, slide_id = source_entries[source_index]
                desired.append((source_part, source_index, slide_id))
                continue

            template_index = next(
                (
                    candidate
                    for candidate in reversed(normalized_indexes[:position])
                    if candidate is not None
                ),
                None,
            )
            if template_index is None:
                template_index = next(
                    (
                        candidate
                        for candidate in normalized_indexes[position + 1 :]
                        if candidate is not None
                    ),
                    0,
                )
            template_part = source_entries[template_index][0]
            new_part = self.clone_blank_slide_part(template_part)
            relationship_id = next_relationship_id(rels)
            ET.SubElement(
                rels,
                qn(REL, "Relationship"),
                {
                    "Id": relationship_id,
                    "Type": SLIDE_REL_TYPE,
                    "Target": relative_target("ppt", new_part),
                },
            )
            slide_id = ET.Element(
                qn(P, "sldId"),
                {"id": str(next_slide_id), qn(R, "id"): relationship_id},
            )
            next_slide_id += 1
            desired.append((new_part, None, slide_id))

        slide_id_list.clear()
        for _part, _source_index, slide_id in desired:
            slide_id_list.append(slide_id)
        self.files["ppt/presentation.xml"] = xml_bytes(
            presentation, namespace_source=presentation_xml
        )
        self.files[rels_name] = xml_bytes(rels, namespace_source=rels_xml)
        content_types_xml = self.files.get("[Content_Types].xml")
        self.files["[Content_Types].xml"] = xml_bytes(
            self.content_types_root, namespace_source=content_types_xml
        )
        return [(part, source_index) for part, source_index, _slide_id in desired]

    def clone_blank_slide_part(self, template_part: str) -> str:
        used_indexes = {
            int(match.group(1))
            for name in self.files
            if (match := re.fullmatch(r"ppt/slides/slide(\d+)\.xml", name))
        }
        slide_index = max(used_indexes, default=0) + 1
        while f"ppt/slides/slide{slide_index}.xml" in self.files:
            slide_index += 1
        new_part = f"ppt/slides/slide{slide_index}.xml"

        template_xml = self.files[template_part]
        slide = parse_xml(template_xml)
        common_slide_data = slide.find(f"{{{P}}}cSld")
        if common_slide_data is None:
            raise ValueError("Source slide is missing common slide data")
        remove_children(common_slide_data, {qn(P, "bg")})
        shape_tree = common_slide_data.find(f"{{{P}}}spTree")
        if shape_tree is None:
            raise ValueError("Source slide is missing its shape tree")
        for child in list(shape_tree):
            if is_shape_element(child):
                shape_tree.remove(child)
        remove_children(slide, {qn(P, "transition"), qn(P, "timing")})
        self.files[new_part] = xml_bytes(slide, namespace_source=template_xml)

        template_rels_name = rels_part_name(template_part)
        template_rels_xml = self.files.get(template_rels_name)
        template_rels = parse_relationships(template_rels_xml)
        for relationship in list(template_rels.findall(f"{{{REL}}}Relationship")):
            if relationship.get("Type") == NOTES_SLIDE_REL_TYPE:
                template_rels.remove(relationship)
        self.files[rels_part_name(new_part)] = xml_bytes(
            template_rels, namespace_source=template_rels_xml
        )

        template_override = next(
            (
                override
                for override in self.content_types_root.findall(f"{{{CT}}}Override")
                if (override.get("PartName") or "").lstrip("/") == template_part
            ),
            None,
        )
        if template_override is not None:
            ET.SubElement(
                self.content_types_root,
                qn(CT, "Override"),
                {
                    "PartName": f"/{new_part}",
                    "ContentType": template_override.get("ContentType") or "",
                },
            )
        return new_part

    def patch_slide(self, slide_part: str, slide_ir: dict[str, Any], original_slide: dict[str, Any] | None) -> None:
        if slide_part not in self.files:
            return

        slide_xml = self.files[slide_part]
        root = parse_xml(self.files[slide_part])
        sp_tree = root.find(f"{{{P}}}cSld/{{{P}}}spTree")
        if sp_tree is None:
            return

        rels_name = rels_part_name(slide_part)
        rels_xml = self.files.get(rels_name)
        content_types_xml = self.files.get("[Content_Types].xml")
        rels_root = parse_relationships(rels_xml)
        shape_children = [child for child in list(sp_tree) if is_shape_element(child)]
        original_shapes = (original_slide or {}).get("shapes") or []
        direct_original_elements = map_original_shapes_to_elements(original_shapes, shape_children)
        desired_shapes = slide_ir.get("shapes") or []
        desired_ids = shape_ids_from_ir(desired_shapes)
        existing_ids = shape_ids_from_elements(shape_children)
        next_shape_id = max([0, *existing_ids, *[int(i) for i in desired_ids]])
        ctx = SlideContext(self, slide_part, rels_root, next_shape_id)

        if shape_changed(slide_ir.get("background"), (original_slide or {}).get("background")):
            write_slide_background(
                ctx,
                root,
                slide_ir.get("background"),
                original_background=(original_slide or {}).get("background"),
            )

        prefix, suffix = split_shape_tree_children(sp_tree)
        patched_shapes: list[ET.Element] = []
        used_original_indexes: set[int] = set()
        used_direct_elements: set[int] = set()
        mapped_direct_elements = {id(elem) for elem in direct_original_elements if elem is not None}

        for desired_index, shape_ir in enumerate(desired_shapes):
            shape_id = shape_ir.get("shape_id")
            if not isinstance(shape_id, int):
                shape_id = ctx.allocate_shape_id()
                shape_ir = {**shape_ir, "shape_id": shape_id}

            original_index = find_matching_original_shape(shape_ir, original_shapes, used_original_indexes)
            if original_index is None:
                patched = build_shape_element(ctx, shape_ir)
                if patched is None:
                    raise ValueError(
                        f"Source-backed PPTX export cannot synthesize shape at path {desired_index}"
                    )
            else:
                used_original_indexes.add(original_index)
                original_shape = original_shapes[original_index]
                existing = direct_original_elements[original_index]
                if existing is None:
                    # The shape came from a layout/master inheritance fallback
                    # and is not physically present in this slide XML. An
                    # unchanged shape remains inherited, but an edit must use
                    # the source-free writer so the current IR is materialized.
                    if shape_changed(shape_ir, original_shape):
                        raise RoundtripFallbackRequired(
                            "Source-backed PPTX export cannot patch an edited inherited shape"
                        )
                    continue
                used_direct_elements.add(id(existing))
                patched = patch_shape_element(
                    ctx,
                    copy.deepcopy(existing),
                    shape_ir,
                    original_shape,
                    shape_path=(desired_index,),
                )
                if patched is None:
                    raise ValueError(
                        f"Source-backed PPTX export cannot patch shape at path {desired_index}"
                    )
            patched_shapes.append(patched)

        for original_index, existing in enumerate(direct_original_elements):
            if existing is None and original_index not in used_original_indexes:
                raise RoundtripFallbackRequired(
                    "Source-backed PPTX export cannot delete an inherited shape"
                )

        # Preserve shapes that the parser did not surface. Direct slide shapes
        # mapped to original IR but absent from edited IR are treated as user
        # deletions.
        for child in shape_children:
            if id(child) not in mapped_direct_elements and id(child) not in used_direct_elements:
                patched_shapes.append(child)

        attrs = dict(sp_tree.attrib)
        sp_tree.clear()
        sp_tree.attrib.update(attrs)
        for child in [*prefix, *patched_shapes, *suffix]:
            sp_tree.append(child)

        if shape_changed(slide_ir.get("transition"), (original_slide or {}).get("transition")):
            write_slide_transition(root, slide_ir.get("transition"))

        self.prune_unreferenced_image_relationships(slide_part, root, rels_root)
        self.files[slide_part] = xml_bytes(root, namespace_source=slide_xml)
        self.files[rels_name] = xml_bytes(rels_root, namespace_source=rels_xml)
        self.files["[Content_Types].xml"] = xml_bytes(self.content_types_root, namespace_source=content_types_xml)

    def prune_unreferenced_image_relationships(
        self,
        slide_part: str,
        slide_root: ET.Element,
        rels_root: ET.Element,
    ) -> None:
        referenced_ids = relationship_ids_in_xml(slide_root)
        for relationship in list(rels_root.findall(f"{{{REL}}}Relationship")):
            if relationship.get("Type") != IMAGE_REL_TYPE:
                continue
            relationship_id = relationship.get("Id")
            if relationship_id and relationship_id in referenced_ids:
                continue
            if relationship.get("TargetMode") != "External":
                target = relationship.get("Target")
                if target:
                    target_part = join_part_target(slide_part, target)
                    if target_part.startswith("ppt/media/"):
                        self.orphan_media_candidates.add(target_part)
            rels_root.remove(relationship)

    def add_media(self, data: bytes, content_type: str, slide_part: str) -> tuple[str, str]:
        ext = image_extension(content_type)
        used = {
            int(match.group(1))
            for name in self.files
            if (match := re.match(rf"ppt/media/image(\d+)\.{re.escape(ext)}$", name))
        }
        index = 1
        while index in used or f"ppt/media/image{index}.{ext}" in self.files:
            index += 1
        media_part = f"ppt/media/image{index}.{ext}"
        self.files[media_part] = data
        target = relative_target(posixpath.dirname(slide_part), media_part)
        return media_part, target

    def ensure_content_type(self, part_name: str, content_type: str) -> None:
        ext = Path(part_name).suffix.lstrip(".")
        if not ext:
            return
        for default in self.content_types_root.findall(f"{{{CT}}}Default"):
            if default.get("Extension") == ext:
                return
        ET.SubElement(
            self.content_types_root,
            qn(CT, "Default"),
            {"Extension": ext, "ContentType": content_type},
        )

    def write(self, output_path: str | Path) -> None:
        self.prune_orphan_media_candidates()
        with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as zout:
            for name, data in self.files.items():
                zout.writestr(name, data)

    def prune_orphan_media_candidates(self) -> None:
        if not self.orphan_media_candidates:
            return
        referenced_parts: set[str] = set()
        for rels_name, data in self.files.items():
            source_part = source_part_name_from_rels(rels_name)
            if source_part is None:
                continue
            for relationship in parse_relationships(data).findall(f"{{{REL}}}Relationship"):
                if relationship.get("TargetMode") == "External":
                    continue
                target = relationship.get("Target")
                if target:
                    referenced_parts.add(join_part_target(source_part, target))

        removed_parts = self.orphan_media_candidates - referenced_parts
        if not removed_parts:
            return
        for part_name in removed_parts:
            self.files.pop(part_name, None)
        for override in list(self.content_types_root.findall(f"{{{CT}}}Override")):
            if (override.get("PartName") or "").lstrip("/") in removed_parts:
                self.content_types_root.remove(override)
        content_types_xml = self.files.get("[Content_Types].xml")
        self.files["[Content_Types].xml"] = xml_bytes(
            self.content_types_root,
            namespace_source=content_types_xml,
        )

OoxmlPackage.__module__ = 'pptx2html.server.ooxml_pptx_writer'
