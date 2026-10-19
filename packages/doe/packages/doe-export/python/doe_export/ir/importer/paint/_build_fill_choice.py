# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_fill_choice
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Fill, Optional, local_name

def _build_fill_choice(self, fill_elem: ET.Element, owner: object | None = None) -> Optional[Fill]:
    """Build a fill from a DrawingML EG_FillProperties choice element."""
    choice = local_name(fill_elem.tag)
    if choice == "solidFill":
        return self._build_solid_fill(fill_elem)
    if choice == "gradFill":
        return self._build_gradient_fill(fill_elem)
    if choice == "pattFill":
        return self._build_pattern_fill(fill_elem)
    if choice == "blipFill":
        return self._build_picture_fill(fill_elem, owner)
    if choice == "noFill":
        return Fill(type="none")
    return None

_build_fill_choice.__module__ = 'pptx2html.ir.builder'
_build_fill_choice.__qualname__ = 'PresentationBuilder._build_fill_choice'
