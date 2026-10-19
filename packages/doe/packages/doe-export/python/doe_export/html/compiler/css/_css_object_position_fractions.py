# Origin: pptx2html/htmlir/compiler.py::_css_object_position_fractions
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._position_token_fraction import _position_token_fraction

def _css_object_position_fractions(value: Any) -> tuple[float, float]:
    raw = str(value or "").strip().lower()
    if not raw:
        return 0.5, 0.5
    raw = raw.replace(",", " ")
    tokens = [token for token in raw.split() if token]
    if not tokens:
        return 0.5, 0.5
    horizontal_keywords = {"left", "center", "right"}
    vertical_keywords = {"top", "center", "bottom"}
    if len(tokens) == 1:
        token = tokens[0]
        if token in {"top", "bottom"}:
            return 0.5, _position_token_fraction(token, axis="y")
        return _position_token_fraction(token, axis="x"), 0.5
    x_token = tokens[0]
    y_token = tokens[1]
    if x_token in vertical_keywords and y_token in horizontal_keywords:
        x_token, y_token = y_token, x_token
    return _position_token_fraction(x_token, axis="x"), _position_token_fraction(y_token, axis="y")

_css_object_position_fractions.__module__ = 'pptx2html.htmlir.compiler'
