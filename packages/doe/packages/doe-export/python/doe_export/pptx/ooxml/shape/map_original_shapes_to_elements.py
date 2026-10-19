# Origin: pptx2html/server/ooxml_pptx_writer.py::map_original_shapes_to_elements
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shape.shape_matches_element import shape_matches_element

def map_original_shapes_to_elements(
    original_shapes: list[dict[str, Any]],
    shape_children: list[ET.Element],
) -> list[ET.Element | None]:
    """Map original IR shapes to physical slide XML elements by sequence.

    The parser can surface inherited layout/master shapes before direct slide
    shapes, and real decks can reuse `cNvPr@id`. A pure ID map is therefore not
    safe for export. This sequence matcher skips inherited IR shapes and maps
    only shapes that are physically present in the slide XML.
    """

    result: list[ET.Element | None] = [None] * len(original_shapes)
    search_start = 0
    for index, shape in enumerate(original_shapes):
        if shape.get("source_scope") in {"layout", "master"}:
            continue
        for xml_index in range(search_start, len(shape_children)):
            if shape_matches_element(shape, shape_children[xml_index]):
                result[index] = shape_children[xml_index]
                search_start = xml_index + 1
                break
    return result

map_original_shapes_to_elements.__module__ = 'pptx2html.server.ooxml_pptx_writer'
