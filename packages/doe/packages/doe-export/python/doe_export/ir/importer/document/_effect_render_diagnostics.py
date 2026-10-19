# Origin: pptx2html/ir/builder.py::PresentationBuilder._effect_render_diagnostics
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional, local_name

@staticmethod
def _effect_render_diagnostics(container: Optional[ET.Element]) -> list[str]:
    if container is None:
        return []
    diagnostics: list[str] = []
    seen = {local_name(elem.tag) for elem in container.iter()}
    if seen.intersection({"scene3d", "sp3d", "bevelT", "bevelB", "extrusionClr", "contourClr"}):
        diagnostics.append("Theme/style 3D shape effects are parsed and rendered as a Canvas approximation")
    if "effectDag" in seen:
        diagnostics.append("Theme/style effect DAG is referenced but only simple effects are rendered")
    unsupported = sorted(seen.intersection({"reflection", "fillOverlay", "duotone", "biLevel", "clrChange", "clrRepl"}))
    if unsupported:
        diagnostics.append(f"Unsupported theme/style effect(s): {', '.join(unsupported)}")
    return diagnostics

_effect_render_diagnostics.__func__.__module__ = 'pptx2html.ir.builder'
_effect_render_diagnostics.__func__.__qualname__ = 'PresentationBuilder._effect_render_diagnostics'
