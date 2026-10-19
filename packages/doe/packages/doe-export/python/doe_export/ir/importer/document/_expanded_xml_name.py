# Origin: pptx2html/ir/builder.py::PresentationBuilder._expanded_xml_name
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@staticmethod
def _expanded_xml_name(value: object) -> tuple[Optional[str], str]:
    text = str(value)
    if text.startswith("{"):
        namespace, separator, name = text[1:].partition("}")
        if separator:
            return namespace, name.lower()
    return None, text.lower()

_expanded_xml_name.__func__.__module__ = 'pptx2html.ir.builder'
_expanded_xml_name.__func__.__qualname__ = 'PresentationBuilder._expanded_xml_name'
