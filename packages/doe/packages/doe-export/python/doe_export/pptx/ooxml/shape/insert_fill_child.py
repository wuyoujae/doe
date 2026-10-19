# Origin: pptx2html/server/ooxml_pptx_writer.py::insert_fill_child
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import A
from doe_export.pptx.ooxml.xml.qn import qn

def insert_fill_child(parent: ET.Element, child: ET.Element) -> None:
    """Insert an EG_FillProperties child at its schema-defined position.

    PowerPoint ignores shape fills serialized after ``a:ln`` or effect/3D
    children even though some lightweight validators accept that order. Table
    cell fills are the exception: their border children precede the fill.
    """

    if parent.tag == qn(A, "tcPr"):
        tail_tags = {qn(A, "cell3D"), qn(A, "extLst")}
    else:
        tail_tags = {
            qn(A, "ln"),
            qn(A, "effectLst"),
            qn(A, "effectDag"),
            qn(A, "scene3d"),
            qn(A, "sp3d"),
            qn(A, "extLst"),
        }
    for index, existing in enumerate(list(parent)):
        if existing.tag in tail_tags:
            parent.insert(index, child)
            return
    parent.append(child)

insert_fill_child.__module__ = 'pptx2html.server.ooxml_pptx_writer'
