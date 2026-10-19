# Origin: pptx2html/server/ooxml_pptx_writer.py::relationship_ids_in_xml
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import R

def relationship_ids_in_xml(root: ET.Element) -> set[str]:
    relationship_prefix = f"{{{R}}}"
    return {
        value
        for element in root.iter()
        for name, value in element.attrib.items()
        if name.startswith(relationship_prefix) and value
    }

relationship_ids_in_xml.__module__ = 'pptx2html.server.ooxml_pptx_writer'
