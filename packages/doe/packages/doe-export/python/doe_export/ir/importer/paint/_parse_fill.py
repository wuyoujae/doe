# Origin: pptx2html/ir/builder.py::PresentationBuilder._parse_fill
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Fill, NAMESPACE, Optional

def _parse_fill(self, container: Optional[ET.Element], owner: object | None = None) -> Optional[Fill]:
    """Parse fill from a shape properties container (``p:spPr`` / ``p:bg``)."""
    if container is None:
        return None
    _A = NAMESPACE.DML_MAIN

    for child_name in ("solidFill", "gradFill", "pattFill", "blipFill", "noFill"):
        fill_elem = container.find(f"{{{_A}}}{child_name}")
        if fill_elem is not None:
            return self._build_fill_choice(fill_elem, owner)

    # FIXME: gradFill — see FIXME.md

    return None

_parse_fill.__module__ = 'pptx2html.ir.builder'
_parse_fill.__qualname__ = 'PresentationBuilder._parse_fill'
