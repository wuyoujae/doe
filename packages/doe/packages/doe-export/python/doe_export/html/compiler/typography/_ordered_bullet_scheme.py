# Origin: pptx2html/htmlir/compiler.py::_ordered_bullet_scheme
from __future__ import annotations

def _ordered_bullet_scheme(style: str) -> str:
    normalized = style.replace("_", "-")
    return {
        "lower-alpha": "alphaLcPeriod",
        "lower-latin": "alphaLcPeriod",
        "upper-alpha": "alphaUcPeriod",
        "upper-latin": "alphaUcPeriod",
        "lower-roman": "romanLcPeriod",
        "upper-roman": "romanUcPeriod",
    }.get(normalized, "arabicPeriod")

_ordered_bullet_scheme.__module__ = 'pptx2html.htmlir.compiler'
