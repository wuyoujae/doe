# Origin: pptx2html/server/ooxml_pptx_writer.py::xml_bytes
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.package.register_source_namespaces import register_source_namespaces

def xml_bytes(root: ET.Element, *, namespace_source: bytes | None = None) -> bytes:
    if namespace_source:
        register_source_namespaces([namespace_source])
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)

xml_bytes.__module__ = 'pptx2html.server.ooxml_pptx_writer'
