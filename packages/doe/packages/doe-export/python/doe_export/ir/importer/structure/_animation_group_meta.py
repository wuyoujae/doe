# Origin: pptx2html/ir/builder.py::PresentationBuilder._animation_group_meta
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional

@staticmethod
def _animation_group_meta(
    c_tn: Optional[ET.Element],
    inherited: dict[str, str],
) -> dict[str, str]:
    meta = dict(inherited)
    if c_tn is None:
        return meta
    keys = ("id", "nodeType", "presetID", "presetClass", "presetSubtype", "grpId")
    if any(c_tn.get(key) for key in keys):
        for key in keys:
            value = c_tn.get(key)
            if value is not None:
                meta[key] = value
    return meta

_animation_group_meta.__func__.__module__ = 'pptx2html.ir.builder'
_animation_group_meta.__func__.__qualname__ = 'PresentationBuilder._animation_group_meta'
