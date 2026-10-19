# Origin: schema_v4_math.py::_style_runs
from __future__ import annotations
from .shared import DRAWINGML_NS, MATH_NS, NativeFormulaSpec, etree

def _style_runs(omath: etree._Element, spec: NativeFormulaSpec) -> None:
    size = str(max(800, min(20_000, int(round(spec.font_size_pt * 100)))))
    for run in omath.xpath(".//m:r", namespaces={"m": MATH_NS}):
        for existing in list(run):
            if existing.tag == f"{{{DRAWINGML_NS}}}rPr":
                run.remove(existing)
        properties = etree.Element(
            f"{{{DRAWINGML_NS}}}rPr", lang="en-US", sz=size, dirty="0"
        )
        fill = etree.SubElement(properties, f"{{{DRAWINGML_NS}}}solidFill")
        etree.SubElement(fill, f"{{{DRAWINGML_NS}}}srgbClr", val=spec.color)
        etree.SubElement(properties, f"{{{DRAWINGML_NS}}}latin", typeface="Cambria Math")
        etree.SubElement(properties, f"{{{DRAWINGML_NS}}}ea", typeface="Cambria Math")
        run.insert(0, properties)

_style_runs.__module__ = 'schema_v4_math'
