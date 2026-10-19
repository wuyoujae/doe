# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_group
from __future__ import annotations
from doe_export.ir.importer.shared import GroupShape, NAMESPACE, Shape, copy

def _build_group(self, shape: GroupShape) -> Shape:
    _A = NAMESPACE.DML_MAIN
    _P = NAMESPACE.PML_MAIN
    group_properties = shape._element.find(f"{{{_P}}}grpSpPr")
    inherited_group_fill = self._active_group_fill
    group_fill = self._parse_fill(group_properties, shape)
    if (
        group_fill is None
        and group_properties is not None
        and group_properties.find(f"{{{_A}}}grpFill") is not None
    ):
        group_fill = copy.deepcopy(inherited_group_fill)

    children = []
    previous_group_fill = self._active_group_fill
    self._active_group_fill = group_fill
    try:
        for child in shape.shapes:
            ir_child = self._build_shape(child)
            if ir_child is None:
                continue
            child_properties = self._shape_sp_pr(child)
            if (
                group_fill is not None
                and child_properties is not None
                and child_properties.find(f"{{{_A}}}grpFill") is not None
            ):
                ir_child.fill = copy.deepcopy(group_fill)
            children.append(ir_child)
    finally:
        self._active_group_fill = previous_group_fill
    bounds = self._build_bounds(shape)
    group_bounds = self._build_group_bounds(shape)
    self._normalize_group_children(children, bounds, group_bounds)
    ir = Shape(
        type="group_shape",
        name=shape.name,
        shape_id=shape.shape_id,
        hidden=shape.hidden,
        bounds=bounds,
        rotation=shape.rotation,
        flip_horizontal=self._build_flip(shape, "flipH"),
        flip_vertical=self._build_flip(shape, "flipV"),
        fill=copy.deepcopy(group_fill),
        shapes=children,
        group_bounds=group_bounds,
    )
    ir.diagnostics.extend(self._shape_render_diagnostics(shape))
    return ir

_build_group.__module__ = 'pptx2html.ir.builder'
_build_group.__qualname__ = 'PresentationBuilder._build_group'
