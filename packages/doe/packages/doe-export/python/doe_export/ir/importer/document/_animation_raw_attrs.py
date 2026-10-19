# Origin: pptx2html/ir/builder.py::PresentationBuilder._animation_raw_attrs
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional

@staticmethod
def _animation_raw_attrs(
    elem: ET.Element,
    c_tn: Optional[ET.Element],
    group: Optional[dict[str, str]] = None,
) -> dict[str, str]:
    raw = {str(k): str(v) for k, v in elem.attrib.items()}
    if c_tn is not None:
        for key, value in c_tn.attrib.items():
            raw[f"cTn.{key}"] = str(value)
    for key, value in (group or {}).items():
        raw[f"group.{key}"] = str(value)
    return raw

_animation_raw_attrs.__func__.__module__ = 'pptx2html.ir.builder'
_animation_raw_attrs.__func__.__qualname__ = 'PresentationBuilder._animation_raw_attrs'
