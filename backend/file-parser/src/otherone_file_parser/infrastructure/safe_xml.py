from __future__ import annotations

import xml.etree.ElementTree as ET
from dataclasses import dataclass

from defusedxml import ElementTree as DefusedElementTree

MAX_XML_PART_BYTES = 16 * 1024 * 1024
MAX_XML_TOTAL_BYTES = 64 * 1024 * 1024
MAX_XML_TOTAL_NODES = 500_000
MAX_XML_TOTAL_ATTRIBUTES = 1_000_000
MAX_XML_TOTAL_TEXT_CHARS = 32 * 1024 * 1024
MAX_XML_DEPTH = 128
MAX_OOXML_RELATIONSHIPS = 50_000


class XmlBudgetExceeded(ValueError):
    pass


@dataclass
class XmlArchiveBudget:
    bytes: int = 0
    nodes: int = 0
    attributes: int = 0
    text_chars: int = 0
    relationships: int = 0

    def validate(self, source: bytes) -> None:
        if len(source) > MAX_XML_PART_BYTES:
            raise XmlBudgetExceeded("OOXML XML part is too large")
        self.bytes += len(source)
        if self.bytes > MAX_XML_TOTAL_BYTES:
            raise XmlBudgetExceeded("OOXML XML total is too large")

        root = DefusedElementTree.fromstring(
            source,
            forbid_dtd=True,
            forbid_entities=True,
            forbid_external=True,
        )
        stack: list[tuple[ET.Element, int]] = [(root, 1)]
        while stack:
            element, depth = stack.pop()
            self.nodes += 1
            if self.nodes > MAX_XML_TOTAL_NODES:
                raise XmlBudgetExceeded("OOXML contains too many XML nodes")
            if depth > MAX_XML_DEPTH:
                raise XmlBudgetExceeded("OOXML XML nesting is too deep")

            self.attributes += len(element.attrib)
            if self.attributes > MAX_XML_TOTAL_ATTRIBUTES:
                raise XmlBudgetExceeded("OOXML contains too many XML attributes")
            self.text_chars += len(element.text or "") + len(element.tail or "")
            self.text_chars += sum(len(name) + len(value) for name, value in element.attrib.items())
            if self.text_chars > MAX_XML_TOTAL_TEXT_CHARS:
                raise XmlBudgetExceeded("OOXML XML text is too large")

            if _local_name(element.tag) == "Relationship":
                self.relationships += 1
                if self.relationships > MAX_OOXML_RELATIONSHIPS:
                    raise XmlBudgetExceeded("OOXML contains too many relationships")
            stack.extend((child, depth + 1) for child in reversed(list(element)))


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]
