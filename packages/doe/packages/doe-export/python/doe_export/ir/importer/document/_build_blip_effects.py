# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_blip_effects
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Shadow

@staticmethod
def _build_blip_effects(blip: ET.Element) -> list[Shadow]:
    if blip.find(f"{{{NAMESPACE.DML_MAIN}}}grayscl") is not None:
        return [Shadow(type="grayscale", alpha=1.0)]
    return []

_build_blip_effects.__func__.__module__ = 'pptx2html.ir.builder'
_build_blip_effects.__func__.__qualname__ = 'PresentationBuilder._build_blip_effects'
