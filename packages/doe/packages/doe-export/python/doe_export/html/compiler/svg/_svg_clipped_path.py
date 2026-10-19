# Origin: pptx2html/htmlir/compiler.py::_svg_clipped_path
from __future__ import annotations
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.svg._svg_graphic_node_to_normalized_d import _svg_graphic_node_to_normalized_d
from doe_export.html.compiler.svg._svg_path_to_normalized_d import _svg_path_to_normalized_d
from doe_export.html.compiler.svg._svg_transformed_path import _svg_transformed_path

def _svg_clipped_path(data: str, clips: list, bounds: Bounds, sx: float, sy: float) -> str | None:
    import pathops
    from fontTools.svgLib.path import parse_path
    from fontTools.pens.svgPathPen import SVGPathPen

    path = pathops.Path()
    parse_path(data, path.getPen())
    for records in clips:
        combined = pathops.Path()
        for record in records:
            geometry = _svg_graphic_node_to_normalized_d(record, (0, 0, 100, 100))
            geometry = _svg_transformed_path(geometry, record["matrix"], bounds, sx, sy)
            if not geometry:
                continue
            child = pathops.Path()
            parse_path(geometry, child.getPen())
            combined = pathops.op(combined, child, pathops.PathOp.UNION)
        path = pathops.op(path, combined, pathops.PathOp.INTERSECTION)
    pen = SVGPathPen(None)
    path.draw(pen)
    return _svg_path_to_normalized_d(pen.getCommands(), (0, 0, 100, 100))

_svg_clipped_path.__module__ = 'pptx2html.htmlir.compiler'
