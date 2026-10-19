# Origin: schema_v4_math.py::add_native_formula
from __future__ import annotations
from .shared import Any, DRAWINGML_2010_NS, DRAWINGML_NS, MATH_NS, MSO_ANCHOR, PP_ALIGN, Pt, etree, qn
from ._mathml_to_omml import _mathml_to_omml
from ._style_runs import _style_runs
from .formula_spec import formula_spec

def add_native_formula(slide, component: dict[str, Any]) -> None:
    spec = formula_spec(component)
    left, top, width, height = (int(Pt(value)) for value in spec.bounds_pt)
    shape = slide.shapes.add_textbox(left, top, width, height)
    shape.name = f"Native Formula {spec.component_id}"
    frame = shape.text_frame
    frame.clear()
    frame.word_wrap = False
    frame.vertical_anchor = MSO_ANCHOR.MIDDLE
    frame.margin_left = frame.margin_right = Pt(0)
    frame.margin_top = frame.margin_bottom = Pt(0)
    paragraph = frame.paragraphs[0]
    paragraph.alignment = {
        "left": PP_ALIGN.LEFT,
        "right": PP_ALIGN.RIGHT,
    }.get(spec.align, PP_ALIGN.CENTER)

    omath = _mathml_to_omml(spec.mathml)
    _style_runs(omath, spec)
    wrapper = etree.Element(
        f"{{{DRAWINGML_2010_NS}}}m",
        nsmap={"a14": DRAWINGML_2010_NS, "m": MATH_NS},
    )
    math_paragraph = etree.SubElement(wrapper, f"{{{MATH_NS}}}oMathPara")
    properties = etree.SubElement(math_paragraph, f"{{{MATH_NS}}}oMathParaPr")
    alignment = {"left": "left", "right": "right"}.get(spec.align, "centerGroup")
    etree.SubElement(
        properties,
        f"{{{MATH_NS}}}jc",
        attrib={f"{{{MATH_NS}}}val": alignment},
    )
    math_paragraph.append(omath)
    paragraph._p.insert(0, wrapper)
    end_properties = paragraph._p.find(qn("a:endParaRPr"))
    if end_properties is None:
        end_properties = etree.SubElement(
            paragraph._p, f"{{{DRAWINGML_NS}}}endParaRPr"
        )
    end_properties.set("lang", "en-US")
    end_properties.set("sz", str(int(round(spec.font_size_pt * 100))))
    end_properties.set("dirty", "0")

add_native_formula.__module__ = 'schema_v4_math'
