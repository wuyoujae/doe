# Origin: pptx2html/ir/builder.py::PresentationBuilder._shape_render_diagnostics
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, local_name

def _shape_render_diagnostics(self, shape: BaseShape) -> list[str]:
    """Record package features that are visible in XML but not fully rendered."""
    diagnostics: list[str] = []
    seen = {local_name(elem.tag) for elem in shape._element.iter()}

    if seen.intersection({"scene3d", "sp3d", "bevelT", "bevelB", "extrusionClr", "contourClr"}):
        diagnostics.append("3D shape effects are parsed and rendered as a Canvas approximation")
    if "effectDag" in seen:
        diagnostics.append("Effect DAG is present but only simple effectLst effects are rendered")

    unsupported_effects = sorted(seen.intersection({"reflection", "fillOverlay", "duotone", "biLevel", "clrChange", "clrRepl"}))
    if unsupported_effects:
        diagnostics.append(f"Unsupported effect(s): {', '.join(unsupported_effects)}")

    media = sorted(seen.intersection({"contentPart", "oleObj", "media", "videoFile", "audioFile"}))
    if media:
        diagnostics.append(f"Embedded media/OLE/content part not rendered: {', '.join(media)}")

    return diagnostics

_shape_render_diagnostics.__module__ = 'pptx2html.ir.builder'
_shape_render_diagnostics.__qualname__ = 'PresentationBuilder._shape_render_diagnostics'
