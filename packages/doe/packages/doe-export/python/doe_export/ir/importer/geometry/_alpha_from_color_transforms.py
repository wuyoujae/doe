# Origin: pptx2html/ir/builder.py::PresentationBuilder._alpha_from_color_transforms
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional, local_name, percentage_to_float

@staticmethod
def _alpha_from_color_transforms(color_elem: ET.Element) -> Optional[float]:
    alpha: Optional[float] = None
    for child in list(color_elem):
        name = local_name(child.tag)
        if name == "alpha":
            value = percentage_to_float(child.get("val"))
            if value is not None:
                alpha = value
        elif name == "alphaMod":
            value = percentage_to_float(child.get("val"))
            if value is not None:
                alpha = (1.0 if alpha is None else alpha) * value
        elif name == "alphaOff":
            value = percentage_to_float(child.get("val"))
            if value is not None:
                alpha = (1.0 if alpha is None else alpha) + value
        elif name == "alphaModFix":
            value = percentage_to_float(child.get("amt") or child.get("val"))
            if value is not None:
                alpha = (1.0 if alpha is None else alpha) * value
    if alpha is None:
        return None
    return max(0.0, min(1.0, alpha))

_alpha_from_color_transforms.__func__.__module__ = 'pptx2html.ir.builder'
_alpha_from_color_transforms.__func__.__qualname__ = 'PresentationBuilder._alpha_from_color_transforms'
