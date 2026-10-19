# Origin: schema_v4_math.py::_mathml_to_omml
from __future__ import annotations
from .shared import MATHML_NS, MATH_NS, etree
from ._fallback_mathml_node import _fallback_mathml_node
from ._m import _m
from ._office_xslt_path import _office_xslt_path

def _mathml_to_omml(mathml: str) -> etree._Element:
    parser = etree.XMLParser(resolve_entities=False, no_network=True, remove_comments=True)
    root = etree.fromstring(mathml.encode("utf-8"), parser=parser)
    if etree.QName(root).localname != "math":
        raise ValueError("Native formula MathML root must be <math>.")
    # Yrkie-doe represents ``\\bar{x}`` as a CSS-decorated MathML row so the
    # browser can draw the line without an external math library. Microsoft's
    # XSLT cannot see CSS, therefore promote it to semantic ``mover`` first.
    for element in list(root.iter()):
        if not isinstance(element.tag, str):
            continue
        if etree.QName(element).localname != "mrow":
            continue
        if "ppt-math-formula__overline" not in str(element.get("class") or ""):
            continue
        children = list(element)
        for child in children:
            element.remove(child)
        element.attrib.clear()
        element.tag = "mover"
        if len(children) == 1:
            element.append(children[0])
        else:
            base = etree.Element("mrow")
            base.extend(children)
            element.append(base)
        accent = etree.Element("mo", accent="true")
        accent.text = "¯"
        element.append(accent)
    for element in root.iter():
        if isinstance(element.tag, str):
            element.tag = f"{{{MATHML_NS}}}{etree.QName(element).localname}"
    etree.cleanup_namespaces(root, top_nsmap={None: MATHML_NS})
    xslt_path = _office_xslt_path()
    if xslt_path is not None:
        transform = etree.XSLT(etree.parse(str(xslt_path), parser=parser))
        result = transform(root).getroot()
        if result is not None and etree.QName(result).localname == "oMathPara":
            result = result.find(f"{{{MATH_NS}}}oMath")
        if result is not None and etree.QName(result).localname == "oMath":
            return result
    equation = _m("oMath")
    for item in _fallback_mathml_node(root):
        equation.append(item)
    return equation

_mathml_to_omml.__module__ = 'schema_v4_math'
