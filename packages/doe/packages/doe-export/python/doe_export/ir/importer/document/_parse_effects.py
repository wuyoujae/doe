# Origin: pptx2html/ir/builder.py::PresentationBuilder._parse_effects
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional, Shadow, emu_to_pt, local_name, math

def _parse_effects(self, container: Optional[ET.Element]) -> list[Shadow]:
    if container is None:
        return []
    _A = NAMESPACE.DML_MAIN
    diagnostics = self._effect_render_diagnostics(container)
    effect_lst = container.find(f"{{{_A}}}effectLst")
    if effect_lst is None:
        return []

    effects: list[Shadow] = []
    for child in list(effect_lst):
        name = local_name(child.tag)
        if name == "outerShdw":
            color, alpha = self._color_from_fill_elem(child)
            blur = emu_to_pt(child.get("blurRad"))
            dist = emu_to_pt(child.get("dist")) or 0.0
            direction = self._angle_to_degrees(child.get("dir")) or 0.0
            radians = math.radians(direction)
            effects.append(
                Shadow(
                    type="outer",
                    blur_pt=blur,
                    offset_x=dist * math.cos(radians),
                    offset_y=dist * math.sin(radians),
                    color=color,
                    alpha=alpha,
                )
            )
        elif name == "innerShdw":
            color, alpha = self._color_from_fill_elem(child)
            blur = emu_to_pt(child.get("blurRad"))
            dist = emu_to_pt(child.get("dist")) or 0.0
            direction = self._angle_to_degrees(child.get("dir")) or 0.0
            radians = math.radians(direction)
            effects.append(
                Shadow(
                    type="inner",
                    blur_pt=blur,
                    offset_x=dist * math.cos(radians),
                    offset_y=dist * math.sin(radians),
                    color=color,
                    alpha=alpha,
                )
            )
        elif name == "glow":
            color, alpha = self._color_from_fill_elem(child)
            effects.append(
                Shadow(
                    type="glow",
                    blur_pt=emu_to_pt(child.get("rad")),
                    offset_x=0.0,
                    offset_y=0.0,
                    color=color,
                    alpha=alpha,
                )
            )
        elif name == "softEdge":
            effects.append(
                Shadow(
                    type="softEdge",
                    blur_pt=emu_to_pt(child.get("rad")),
                    offset_x=0.0,
                    offset_y=0.0,
                    color=None,
                    alpha=None,
                )
            )
        elif name == "blur":
            effects.append(
                Shadow(
                    type="blur",
                    blur_pt=emu_to_pt(child.get("rad")),
                    offset_x=0.0,
                    offset_y=0.0,
                    color=None,
                    alpha=None,
                )
            )

    if effects and diagnostics:
        effects[0].diagnostics.extend(diagnostics)
    return effects

_parse_effects.__module__ = 'pptx2html.ir.builder'
_parse_effects.__qualname__ = 'PresentationBuilder._parse_effects'
