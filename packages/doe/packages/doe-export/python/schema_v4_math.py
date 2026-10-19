"""Compatibility API for the modular DOE PowerPoint math implementation."""
from __future__ import annotations

from doe_export.pptx.math.shared import (
    dataclass,
    os,
    Path,
    re,
    Any,
    etree,
    MSO_ANCHOR,
    PP_ALIGN,
    qn,
    Pt,
    DRAWINGML_NS,
    DRAWINGML_2010_NS,
    MATH_NS,
    MATHML_NS,
    FORMULA_COMPONENT_TYPE,
    _HEX_COLOR_RE,
    _RGB_COLOR_RE,
    NativeFormulaSpec,
    __all__,
)
from doe_export.pptx.math._parse_color import _parse_color
from doe_export.pptx.math._read_bounds import _read_bounds
from doe_export.pptx.math.formula_spec import formula_spec
from doe_export.pptx.math._office_xslt_path import _office_xslt_path
from doe_export.pptx.math._m import _m
from doe_export.pptx.math._children import _children
from doe_export.pptx.math._append_converted import _append_converted
from doe_export.pptx.math._fallback_mathml_node import _fallback_mathml_node
from doe_export.pptx.math._mathml_to_omml import _mathml_to_omml
from doe_export.pptx.math._style_runs import _style_runs
from doe_export.pptx.math.add_native_formula import add_native_formula
