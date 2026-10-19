# Origin: pptx2html/ir/builder.py::PresentationBuilder._effective_color_map
from __future__ import annotations
from doe_export.ir.importer.shared import NAMESPACE, _DEFAULT_COLOR_MAP

def _effective_color_map(self, owner: object | None) -> dict[str, str]:
    cache_key = self._owner_cache_key(owner)
    if cache_key is None:
        return dict(_DEFAULT_COLOR_MAP)
    cached = self._color_maps_by_owner.get(cache_key)
    if cached is not None:
        return cached

    _P = NAMESPACE.PML_MAIN
    _A = NAMESPACE.DML_MAIN
    mapping = dict(_DEFAULT_COLOR_MAP)
    for part in reversed(self._owner_part_chain(owner)):
        element = getattr(part, "element", None)
        if element is None:
            continue

        clr_map = element.find(f"{{{_P}}}clrMap")
        if clr_map is not None:
            mapping.update(
                {
                    str(key).lower(): str(value).lower()
                    for key, value in clr_map.attrib.items()
                    if value
                }
            )

        clr_map_override = element.find(f"{{{_P}}}clrMapOvr")
        if clr_map_override is None:
            continue
        override = clr_map_override.find(f"{{{_A}}}overrideClrMapping")
        if override is not None:
            mapping.update(
                {
                    str(key).lower(): str(value).lower()
                    for key, value in override.attrib.items()
                    if value
                }
            )

    self._color_maps_by_owner[cache_key] = mapping
    return mapping

_effective_color_map.__module__ = 'pptx2html.ir.builder'
_effective_color_map.__qualname__ = 'PresentationBuilder._effective_color_map'
