# Origin: pptx2html/server/pptx_writer.py::_shape_type
from __future__ import annotations
from doe_export.pptx.writer.shared import MSO_AUTO_SHAPE_TYPE

def _shape_type(geometry: str | None):
    return {
        "rect": MSO_AUTO_SHAPE_TYPE.RECTANGLE,
        "ellipse": MSO_AUTO_SHAPE_TYPE.OVAL,
        "diamond": MSO_AUTO_SHAPE_TYPE.DIAMOND,
        "flowChartDecision": MSO_AUTO_SHAPE_TYPE.DIAMOND,
        "triangle": MSO_AUTO_SHAPE_TYPE.ISOSCELES_TRIANGLE,
        "rtTriangle": MSO_AUTO_SHAPE_TYPE.RIGHT_TRIANGLE,
        "rightTriangle": MSO_AUTO_SHAPE_TYPE.RIGHT_TRIANGLE,
        "roundRect": MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE,
        "star5": MSO_AUTO_SHAPE_TYPE.STAR_5_POINT,
        "pentagon": MSO_AUTO_SHAPE_TYPE.REGULAR_PENTAGON,
        "hexagon": MSO_AUTO_SHAPE_TYPE.HEXAGON,
        "chord": MSO_AUTO_SHAPE_TYPE.CHORD,
        "donut": MSO_AUTO_SHAPE_TYPE.DONUT,
        "arc": MSO_AUTO_SHAPE_TYPE.ARC,
        "mathPlus": MSO_AUTO_SHAPE_TYPE.MATH_PLUS,
        "mathMultiply": MSO_AUTO_SHAPE_TYPE.MATH_MULTIPLY,
        "parallelogram": MSO_AUTO_SHAPE_TYPE.PARALLELOGRAM,
        "trapezoid": MSO_AUTO_SHAPE_TYPE.TRAPEZOID,
    }.get(geometry or "rect", MSO_AUTO_SHAPE_TYPE.RECTANGLE)

_shape_type.__module__ = 'pptx2html.server.pptx_writer'
