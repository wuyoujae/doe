# Origin: pptx2html/server/ooxml_pptx_writer.py::patch_group_shape
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import A, copy
from doe_export.pptx.ooxml.geometry.build_group_xfrm import build_group_xfrm
from doe_export.pptx.ooxml.shape.build_shape_element import build_shape_element
from doe_export.pptx.ooxml.shape.find_matching_original_shape import find_matching_original_shape
from doe_export.pptx.ooxml.xml.find_or_create import find_or_create
from doe_export.pptx.ooxml.geometry.format_shape_path import format_shape_path
from doe_export.pptx.ooxml.shape.group_child_shape_in_ooxml_space import group_child_shape_in_ooxml_space
from doe_export.pptx.ooxml.shape.is_shape_element import is_shape_element
from doe_export.pptx.ooxml.shape.map_original_shapes_to_elements import map_original_shapes_to_elements
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.replace_direct_child import replace_direct_child
from doe_export.pptx.ooxml.shape.shape_changed import shape_changed
from doe_export.pptx.ooxml.shape.split_shape_tree_children import split_shape_tree_children

def patch_group_shape(
    ctx: SlideContext,
    elem: ET.Element,
    shape: dict[str, Any],
    original: dict[str, Any],
    *,
    shape_path: tuple[int, ...],
) -> None:
    """Patch an imported ``p:grpSp`` without rebuilding its unknown XML.

    Group-child bounds in IR are normalized into the group's displayed outer
    bounds. DrawingML stores those children in the separate ``chOff/chExt``
    coordinate space, so each child must be converted back before its ``xfrm``
    is compared or written.
    """
    from doe_export.pptx.ooxml.shape.patch_shape_element import patch_shape_element

    if any(
        shape_changed(shape.get(key), original.get(key))
        for key in (
            "bounds",
            "group_bounds",
            "rotation",
            "flip_horizontal",
            "flip_vertical",
        )
    ):
        group_transform = build_group_xfrm(shape, shape_path=shape_path)
        group_props = find_or_create(elem, [("p", "grpSpPr")])
        replace_direct_child(group_props, qn(A, "xfrm"), group_transform)

    desired_children = shape.get("shapes") or []
    original_children = original.get("shapes") or []
    xml_children = [child for child in list(elem) if is_shape_element(child)]
    direct_original_elements = map_original_shapes_to_elements(original_children, xml_children)
    mapped_elements = {id(child) for child in direct_original_elements if child is not None}
    used_original_indexes: set[int] = set()
    used_xml_elements: set[int] = set()
    patched_children: list[ET.Element] = []

    for desired_index, desired_child in enumerate(desired_children):
        child_path = (*shape_path, desired_index)
        original_index = find_matching_original_shape(
            desired_child,
            original_children,
            used_original_indexes,
            preferred_index=desired_index,
        )
        desired_xml_shape = group_child_shape_in_ooxml_space(
            desired_child,
            shape,
            shape_path=child_path,
        )
        if original_index is None:
            patched = build_shape_element(ctx, desired_xml_shape)
            if patched is None:
                raise ValueError(
                    f"Source-backed PPTX export cannot synthesize group child at path {format_shape_path(child_path)}"
                )
            patched_children.append(patched)
            continue

        used_original_indexes.add(original_index)
        original_child = original_children[original_index]
        existing = direct_original_elements[original_index]
        if existing is None:
            if shape_changed(desired_child, original_child):
                raise ValueError(
                    f"Source-backed PPTX export cannot locate edited group child at path {format_shape_path(child_path)}"
                )
            continue

        used_xml_elements.add(id(existing))
        original_xml_shape = group_child_shape_in_ooxml_space(
            original_child,
            original,
            shape_path=child_path,
        )
        patched = patch_shape_element(
            ctx,
            copy.deepcopy(existing),
            desired_xml_shape,
            original_xml_shape,
            shape_path=child_path,
        )
        if patched is None:
            raise ValueError(
                f"Source-backed PPTX export cannot patch group child at path {format_shape_path(child_path)}"
            )
        patched_children.append(patched)

    # Children represented by original IR but absent from desired IR are real
    # editor deletions. XML children the parser never surfaced remain byte-for-
    # byte objects (apart from namespace serialization) instead of being lost.
    for child in xml_children:
        if id(child) not in mapped_elements and id(child) not in used_xml_elements:
            patched_children.append(child)

    prefix, suffix = split_shape_tree_children(elem)
    attrs = dict(elem.attrib)
    elem.clear()
    elem.attrib.update(attrs)
    for child in [*prefix, *patched_children, *suffix]:
        elem.append(child)

patch_group_shape.__module__ = 'pptx2html.server.ooxml_pptx_writer'
