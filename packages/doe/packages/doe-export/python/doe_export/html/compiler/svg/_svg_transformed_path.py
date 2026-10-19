# Origin: pptx2html/htmlir/compiler.py::_svg_transformed_path
from __future__ import annotations
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.svg._svg_number import _svg_number

def _svg_transformed_path(data: str | None, matrix: list[float], bounds: Bounds, sx: float, sy: float) -> str | None:
    if not data:
        return None
    # The existing SVG parser has already expanded all relative commands/arcs.
    tokens = data.split()
    output = []
    index = 0
    a, b, c, d, e, f = matrix
    while index < len(tokens):
        if tokens[index] in {"M", "L", "C", "Q", "Z"}:
            output.append(tokens[index])
            index += 1
            continue
        x, y = float(tokens[index]), float(tokens[index + 1])
        output.extend((_svg_number(((a * x + c * y + e) * sx - bounds.left) * 100 / bounds.width),
                       _svg_number(((b * x + d * y + f) * sy - bounds.top) * 100 / bounds.height)))
        index += 2
    return " ".join(output)

_svg_transformed_path.__module__ = 'pptx2html.htmlir.compiler'
