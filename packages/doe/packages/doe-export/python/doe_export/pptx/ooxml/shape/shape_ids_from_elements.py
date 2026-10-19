# Origin: pptx2html/server/ooxml_pptx_writer.py::shape_ids_from_elements
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import P
from doe_export.pptx.ooxml.shape.is_shape_element import is_shape_element
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.shape.shape_id_from_element import shape_id_from_element

def shape_ids_from_elements(elements: list[ET.Element]) -> set[int]:
    result: set[int] = set()
    for elem in elements:
        shape_id = shape_id_from_element(elem)
        if shape_id is not None:
            result.add(shape_id)
        if elem.tag == qn(P, "grpSp"):
            result.update(
                shape_ids_from_elements(
                    [child for child in list(elem) if is_shape_element(child)]
                )
            )
    return result

shape_ids_from_elements.__module__ = 'pptx2html.server.ooxml_pptx_writer'
