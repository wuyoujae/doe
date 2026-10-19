# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._svg_marker_paint
from __future__ import annotations
from doe_export.html.renderer.shared import Border

def _svg_marker_paint(self, border: Border | None, color: str, token: str) -> tuple[str, str]:
    if border is None:
        return "", ""
    definitions: list[str] = []
    attributes: list[str] = []
    for side, marker_type, width_name, length_name in (
        ("start", border.head_end_type, border.head_end_width, border.head_end_length),
        ("end", border.tail_end_type, border.tail_end_width, border.tail_end_length),
    ):
        marker = str(marker_type or "none")
        if marker in {"", "none"}:
            continue
        marker_id = f"{token}-{side}"
        width = {"sm": 5, "med": 7, "lg": 9}.get(str(width_name or "med"), 7)
        height = {"sm": 5, "med": 7, "lg": 9}.get(str(length_name or "med"), 7)
        if marker == "diamond":
            path = '<path d="M0 5 L5 0 L10 5 L5 10 Z"/>'
        elif marker == "oval":
            path = '<ellipse cx="5" cy="5" rx="4.5" ry="3.5"/>'
        elif marker == "stealth":
            path = '<path d="M0 0 L10 5 L0 10 L3 5 Z"/>'
        elif marker in {"arrow", "triangle"}:
            path = '<path d="M0 0 L10 5 L0 10 Z"/>'
        else:
            path = '<path d="M0 0 L10 5 L0 10" fill="none"/>'
        definitions.append(
            f'<marker id="{marker_id}" viewBox="0 0 10 10" refX="9" refY="5" '
            f'markerWidth="{width}" markerHeight="{height}" markerUnits="strokeWidth" '
            f'orient="auto-start-reverse" fill="{color}" stroke="{color}">{path}</marker>'
        )
        attributes.append(f'marker-{side}="url(#{marker_id})"')
    defs = f'<defs>{"".join(definitions)}</defs>' if definitions else ""
    attrs = (" ".join(attributes) + " ") if attributes else ""
    return defs, attrs

_svg_marker_paint.__module__ = 'pptx2html.renderer.html_renderer'
_svg_marker_paint.__qualname__ = 'HtmlRenderer._svg_marker_paint'
