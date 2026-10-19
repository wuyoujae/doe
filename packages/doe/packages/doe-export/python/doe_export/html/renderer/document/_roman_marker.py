# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._roman_marker
from __future__ import annotations

@staticmethod
def _roman_marker(index: int) -> str:
    value = max(1, min(int(index), 3999))
    pairs = [
        (1000, "M"),
        (900, "CM"),
        (500, "D"),
        (400, "CD"),
        (100, "C"),
        (90, "XC"),
        (50, "L"),
        (40, "XL"),
        (10, "X"),
        (9, "IX"),
        (5, "V"),
        (4, "IV"),
        (1, "I"),
    ]
    result = ""
    for amount, marker in pairs:
        while value >= amount:
            result += marker
            value -= amount
    return result

_roman_marker.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_roman_marker.__func__.__qualname__ = 'HtmlRenderer._roman_marker'
