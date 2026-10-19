# Origin: pptx2html/server/ooxml_pptx_writer.py::register_source_namespaces
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import XMLNS_DECL_RE
from doe_export.pptx.ooxml.xml.register_namespace import register_namespace

def register_source_namespaces(xml_blobs: Any) -> None:
    """Keep source OOXML prefixes stable for markup-compatibility attributes.

    ElementTree can rename unknown Office extension namespaces to generated
    prefixes such as ``ns8`` during serialization. That is not safe for PPTX
    round-tripping because attributes like ``mc:Choice Requires="p159"`` store
    namespace prefixes as plain text and ElementTree will not rewrite those
    values. Registering the package's original prefixes before serialization
    keeps the XML acceptable to PowerPoint.
    """

    for blob in xml_blobs:
        if not isinstance(blob, (bytes, bytearray)) or b"xmlns:" not in blob:
            continue
        for raw_prefix, raw_uri in XMLNS_DECL_RE.findall(blob):
            try:
                prefix = raw_prefix.decode("ascii")
                uri = raw_uri.decode("utf-8")
            except UnicodeDecodeError:
                continue
            register_namespace(prefix, uri)

register_source_namespaces.__module__ = 'pptx2html.server.ooxml_pptx_writer'
