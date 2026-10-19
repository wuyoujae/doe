"""Convert Yrkie-doe MathML snapshots into editable PowerPoint equations."""


from __future__ import annotations


from dataclasses import dataclass

import os

from pathlib import Path

import re

from typing import Any


from lxml import etree

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN

from pptx.oxml.ns import qn

from pptx.util import Pt



DRAWINGML_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"

DRAWINGML_2010_NS = "http://schemas.microsoft.com/office/drawing/2010/main"

MATH_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math"

MATHML_NS = "http://www.w3.org/1998/Math/MathML"

FORMULA_COMPONENT_TYPE = "math-formula"


_HEX_COLOR_RE = re.compile(r"#([0-9a-f]{6})\b", re.IGNORECASE)

_RGB_COLOR_RE = re.compile(
    r"rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})",
    re.IGNORECASE,
)



@dataclass(frozen=True)
class NativeFormulaSpec:
    component_id: str
    source: str
    mathml: str
    bounds_pt: tuple[float, float, float, float]
    color: str
    font_size_pt: float
    align: str



__all__ = ["FORMULA_COMPONENT_TYPE", "add_native_formula", "formula_spec"]

NativeFormulaSpec.__module__ = 'schema_v4_math'
