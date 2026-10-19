# Origin: pptx2html/ir/builder.py::PresentationBuilder._image_alpha
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, NAMESPACE, Optional

def _image_alpha(self, shape: BaseShape) -> Optional[float]:
    """Return DrawingML blip opacity for a picture shape, if present."""
    _A = NAMESPACE.DML_MAIN
    _P = NAMESPACE.PML_MAIN
    blip = shape._element.find(f".//{{{_P}}}blipFill/{{{_A}}}blip")
    if blip is None:
        blip = shape._element.find(f".//{{{_A}}}blip")
    return self._alpha_from_color_transforms(blip) if blip is not None else None

_image_alpha.__module__ = 'pptx2html.ir.builder'
_image_alpha.__qualname__ = 'PresentationBuilder._image_alpha'
