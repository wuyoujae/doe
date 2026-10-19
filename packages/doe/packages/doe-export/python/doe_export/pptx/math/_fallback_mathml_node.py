# Origin: schema_v4_math.py::_fallback_mathml_node
from __future__ import annotations
from .shared import etree
from ._children import _children
from ._m import _m

def _fallback_mathml_node(node: etree._Element) -> list[etree._Element]:
    """Convert the formula renderer's common MathML subset to OMML."""
    from ._append_converted import _append_converted

    name = etree.QName(node).localname
    children = _children(node)
    if name == "mrow" and "ppt-math-formula__overline" in str(node.get("class") or ""):
        bar = _m("bar")
        properties = _m("barPr")
        properties.append(_m("pos", val="top"))
        expression = _m("e")
        for child in children:
            _append_converted(expression, child)
        bar.extend((properties, expression))
        return [bar]
    if name in {"math", "mrow", "mstyle", "semantics", "annotation"}:
        output: list[etree._Element] = []
        for child in children:
            output.extend(_fallback_mathml_node(child))
        return output
    if name in {"mi", "mn", "mo", "mtext"}:
        run = _m("r")
        text = _m("t")
        text.text = "".join(node.itertext())
        run.append(text)
        return [run]
    if name == "mspace":
        run = _m("r")
        text = _m("t")
        text.text = " "
        run.append(text)
        return [run]
    if name == "mfrac" and len(children) >= 2:
        fraction = _m("f")
        fraction.append(_m("fPr"))
        numerator = _m("num")
        denominator = _m("den")
        _append_converted(numerator, children[0])
        _append_converted(denominator, children[1])
        fraction.extend((numerator, denominator))
        return [fraction]
    if name in {"msqrt", "mroot"} and children:
        radical = _m("rad")
        properties = _m("radPr")
        if name == "msqrt":
            properties.append(_m("degHide", val="1"))
        radical.append(properties)
        degree = _m("deg")
        expression = _m("e")
        if name == "mroot" and len(children) >= 2:
            _append_converted(degree, children[1])
        _append_converted(expression, children[0])
        radical.extend((degree, expression))
        return [radical]
    scripts = {
        "msub": ("sSub", ("e", "sub")),
        "msup": ("sSup", ("e", "sup")),
        "msubsup": ("sSubSup", ("e", "sub", "sup")),
    }
    if name in scripts and len(children) >= 2:
        container_name, slots = scripts[name]
        container = _m(container_name)
        container.append(_m(f"{container_name}Pr"))
        for slot, child in zip(slots, children):
            wrapper = _m(slot)
            _append_converted(wrapper, child)
            container.append(wrapper)
        return [container]
    if name == "mover" and len(children) == 2 and "".join(children[1].itertext()).strip() in {"¯", "‾"}:
        bar = _m("bar")
        properties = _m("barPr")
        properties.append(_m("pos", val="top"))
        expression = _m("e")
        _append_converted(expression, children[0])
        bar.extend((properties, expression))
        return [bar]
    limits = {
        "munder": ("limLow", ("e", "lim")),
        "mover": ("limUpp", ("e", "lim")),
    }
    if name in limits and len(children) >= 2:
        container_name, slots = limits[name]
        container = _m(container_name)
        container.append(_m(f"{container_name}Pr"))
        for slot, child in zip(slots, children):
            wrapper = _m(slot)
            _append_converted(wrapper, child)
            container.append(wrapper)
        return [container]
    if name == "munderover" and len(children) >= 3:
        base = _m("limLow")
        base.append(_m("limLowPr"))
        upper = _m("limUpp")
        upper.append(_m("limUppPr"))
        upper_expression = _m("e")
        _append_converted(upper_expression, children[0])
        upper_limit = _m("lim")
        _append_converted(upper_limit, children[2])
        upper.extend((upper_expression, upper_limit))
        lower = _m("lim")
        _append_converted(lower, children[1])
        base.extend((upper, lower))
        return [base]
    if name == "mtable":
        matrix = _m("m")
        matrix.append(_m("mPr"))
        for row_node in children:
            if etree.QName(row_node).localname != "mtr":
                continue
            row = _m("mr")
            for cell_node in _children(row_node):
                cell = _m("e")
                _append_converted(cell, cell_node)
                row.append(cell)
            matrix.append(row)
        return [matrix]
    output: list[etree._Element] = []
    for child in children:
        output.extend(_fallback_mathml_node(child))
    if output:
        return output
    run = _m("r")
    text = _m("t")
    text.text = "".join(node.itertext())
    run.append(text)
    return [run]

_fallback_mathml_node.__module__ = 'schema_v4_math'
