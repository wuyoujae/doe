# Origin: pptx2html/server/ooxml_pptx_writer.py::write_line
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import A
from doe_export.pptx.ooxml.shape.build_line import build_line
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.remove_children import remove_children

def write_line(container: ET.Element, border: dict[str, Any] | None) -> None:
    remove_children(container, {qn(A, "ln")})
    if border is None:
        return
    container.append(build_line(border))

write_line.__module__ = 'pptx2html.server.ooxml_pptx_writer'
