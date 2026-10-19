# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_geometry_info
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Optional

def _build_geometry_info(self, shape: BaseShape, preset: Optional[str] = None):
    geometry = self._geometry_name_from_sp_pr(self._shape_sp_pr(shape)) or preset
    bounds = self._build_bounds(shape)
    built = self._geometry_builder.build(
        self._shape_sp_pr(shape),
        preset=preset,
        width=bounds.width if bounds is not None else None,
        height=bounds.height if bounds is not None else None,
    )
    if built.source or built.paths or geometry:
        if built.source == "custom" and not geometry:
            geometry = "custom"
        return geometry, built

    for inherited_shape in self._placeholder_sources(shape):
        inherited_sp_pr = self._shape_sp_pr(inherited_shape)
        geometry = self._geometry_name_from_sp_pr(inherited_sp_pr)
        built = self._geometry_builder.build(
            inherited_sp_pr,
            width=bounds.width if bounds is not None else None,
            height=bounds.height if bounds is not None else None,
        )
        if built.source or built.paths or geometry:
            if built.source == "custom" and not geometry:
                geometry = "custom"
            return geometry, built

    return None, built

_build_geometry_info.__module__ = 'pptx2html.ir.builder'
_build_geometry_info.__qualname__ = 'PresentationBuilder._build_geometry_info'
