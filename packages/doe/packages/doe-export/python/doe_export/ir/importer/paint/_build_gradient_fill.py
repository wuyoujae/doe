# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_gradient_fill
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Fill, GradientStop, NAMESPACE, Optional, parse_bool, percentage_to_float

def _build_gradient_fill(self, fill_elem: ET.Element) -> Optional[Fill]:
    _A = NAMESPACE.DML_MAIN
    stops: list[GradientStop] = []
    for gs in fill_elem.findall(f".//{{{_A}}}gs"):
        pos = percentage_to_float(gs.get("pos")) or 0.0
        color, alpha = self._color_from_fill_elem(gs)
        if color:
            stops.append(GradientStop(position=pos, color=color, alpha=alpha))
    lin = fill_elem.find(f"{{{_A}}}lin")
    path = fill_elem.find(f"{{{_A}}}path")
    fill_to_rect = self._drawingml_rect_percentages(
        path.find(f"{{{_A}}}fillToRect") if path is not None else None
    )
    angle = None
    if lin is not None and lin.get("ang") is not None:
        try:
            angle = int(lin.get("ang")) / 60000.0
        except (TypeError, ValueError):
            angle = None
    return Fill(
        type="gradient",
        gradient_stops=sorted(stops, key=lambda stop: stop.position),
        gradient_angle=angle,
        gradient_path=path.get("path") if path is not None else None,
        gradient_rotate_with_shape=parse_bool(fill_elem.get("rotWithShape")),
        gradient_scaled=parse_bool(lin.get("scaled")) if lin is not None else None,
        gradient_fill_to_left=fill_to_rect["left"],
        gradient_fill_to_right=fill_to_rect["right"],
        gradient_fill_to_top=fill_to_rect["top"],
        gradient_fill_to_bottom=fill_to_rect["bottom"],
    )

_build_gradient_fill.__module__ = 'pptx2html.ir.builder'
_build_gradient_fill.__qualname__ = 'PresentationBuilder._build_gradient_fill'
