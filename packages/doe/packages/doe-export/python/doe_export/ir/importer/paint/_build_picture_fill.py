# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_picture_fill
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Fill, Optional

def _build_picture_fill(self, fill_elem: ET.Element, owner: object | None) -> Optional[Fill]:
    if owner is None:
        return Fill(type="picture")
    return Fill(type="picture", image=self._build_blip_image_info(fill_elem, owner))

_build_picture_fill.__module__ = 'pptx2html.ir.builder'
_build_picture_fill.__qualname__ = 'PresentationBuilder._build_picture_fill'
