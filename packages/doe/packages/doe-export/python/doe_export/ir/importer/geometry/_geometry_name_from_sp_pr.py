# Origin: pptx2html/ir/builder.py::PresentationBuilder._geometry_name_from_sp_pr
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional, local_name

@staticmethod
def _geometry_name_from_sp_pr(sp_pr: Optional[ET.Element]) -> Optional[str]:
    if sp_pr is None:
        return None
    for child in list(sp_pr):
        name = local_name(child.tag)
        if name == "prstGeom":
            return child.get("prst")
        if name == "prstCxn":
            return child.get("prst")
        if name == "custGeom":
            return "custom"
    return None

_geometry_name_from_sp_pr.__func__.__module__ = 'pptx2html.ir.builder'
_geometry_name_from_sp_pr.__func__.__qualname__ = 'PresentationBuilder._geometry_name_from_sp_pr'
