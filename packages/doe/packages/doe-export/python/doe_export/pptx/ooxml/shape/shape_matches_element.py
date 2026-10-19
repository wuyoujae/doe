# Origin: pptx2html/server/ooxml_pptx_writer.py::shape_matches_element
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shape.shape_id_from_element import shape_id_from_element
from doe_export.pptx.ooxml.shape.shape_type_matches_element import shape_type_matches_element

def shape_matches_element(shape: dict[str, Any], elem: ET.Element) -> bool:
    return shape.get("shape_id") == shape_id_from_element(elem) and shape_type_matches_element(shape, elem)

shape_matches_element.__module__ = 'pptx2html.server.ooxml_pptx_writer'
