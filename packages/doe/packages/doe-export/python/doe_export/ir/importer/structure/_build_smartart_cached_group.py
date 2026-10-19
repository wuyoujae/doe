# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_smartart_cached_group
from __future__ import annotations
from doe_export.ir.importer.shared import Bounds, GraphicFrame, NAMESPACE, Optional, RELATIONSHIP_TYPE, Shape, ShapeTree, copy, local_name

def _build_smartart_cached_group(self, shape: GraphicFrame) -> Optional[Shape]:
    """Build editable IR children from SmartArt's cached diagram drawing."""

    if not shape.uri or "diagram" not in shape.uri:
        return None
    data = shape._find_graphic_data()
    if data is None:
        return None

    rel_ids = next((child for child in data if local_name(child.tag) == "relIds"), None)
    data_r_id = (
        rel_ids.get(f"{{{NAMESPACE.OFC_RELATIONSHIPS}}}dm")
        if rel_ids is not None
        else None
    )
    data_part = self._related_part_by_id(shape, data_r_id)
    data_element = getattr(data_part, "element", None)

    drawing_r_id = None
    if data_element is not None:
        for element in data_element.iter():
            if local_name(element.tag) == "dataModelExt" and element.get("relId"):
                drawing_r_id = element.get("relId")
                break

    drawing_part = self._related_part_by_id(shape, drawing_r_id)
    if drawing_part is None:
        candidates = self._related_parts_for_type(
            shape.part,
            RELATIONSHIP_TYPE.DIAGRAM_DRAWING,
        )
        if len(candidates) == 1:
            drawing_part = candidates[0]
    drawing_element = getattr(drawing_part, "element", None)
    if drawing_element is None:
        return None

    source_tree = next(
        (element for element in drawing_element.iter() if local_name(element.tag) == "spTree"),
        None,
    )
    if source_tree is None:
        return None

    converted_tree = copy.deepcopy(source_tree)
    diagram_namespace = f"{{{NAMESPACE.DML_DIAGRAM_DRAWING}}}"
    presentation_namespace = f"{{{NAMESPACE.PML_MAIN}}}"
    for element in converted_tree.iter():
        if element.tag.startswith(diagram_namespace):
            element.tag = presentation_namespace + local_name(element.tag)

    children: list[Shape] = []
    dropped_out_of_bounds_geometry = 0
    for child in ShapeTree(converted_tree, drawing_part):
        child._color_owner_override = shape.part
        ir_child = self._build_shape(child)
        if ir_child is None:
            continue
        if not self._smartart_geometry_is_bounded(ir_child):
            dropped_out_of_bounds_geometry += 1
            continue
        children.append(ir_child)
    child_geometries = {child.geometry for child in children}
    if "pie" in child_geometries and "circularArrow" in child_geometries:
        retained = [child for child in children if child.geometry != "circularArrow"]
        dropped_out_of_bounds_geometry += len(children) - len(retained)
        children = retained
    if not children:
        return None

    bounds = self._build_bounds(shape)
    diagnostics = ["SmartArt rendered from editable cached diagram drawing"]
    if dropped_out_of_bounds_geometry:
        diagnostics.append(
            "SmartArt cached shapes with invalid out-of-bounds geometry were omitted"
        )
    return Shape(
        type="group_shape",
        name=shape.name,
        shape_id=shape.shape_id,
        hidden=shape.hidden,
        bounds=bounds,
        rotation=shape.rotation,
        flip_horizontal=self._build_flip(shape, "flipH"),
        flip_vertical=self._build_flip(shape, "flipV"),
        shapes=children,
        group_bounds=Bounds(
            left=0.0,
            top=0.0,
            width=bounds.width,
            height=bounds.height,
        ),
        diagnostics=diagnostics,
    )

_build_smartart_cached_group.__module__ = 'pptx2html.ir.builder'
_build_smartart_cached_group.__qualname__ = 'PresentationBuilder._build_smartart_cached_group'
