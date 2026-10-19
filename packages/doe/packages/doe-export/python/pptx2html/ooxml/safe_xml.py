"""Bounded XML parsing for untrusted OOXML and SVG payloads."""

from __future__ import annotations

import xml.etree.ElementTree as ET
from pathlib import Path

from defusedxml import ElementTree as DefusedElementTree

MAX_XML_INPUT_BYTES = 16 * 1024 * 1024
MAX_XML_NODES = 200_000
MAX_XML_DEPTH = 128
MAX_XML_TEXT_CHARS = 8 * 1024 * 1024
MAX_XML_ATTRIBUTES = 400_000


def parse_xml(
    source: bytes | str,
    *,
    max_bytes: int = MAX_XML_INPUT_BYTES,
    max_nodes: int = MAX_XML_NODES,
    max_depth: int = MAX_XML_DEPTH,
    max_text_chars: int = MAX_XML_TEXT_CHARS,
    max_attributes: int = MAX_XML_ATTRIBUTES,
) -> ET.Element:
    encoded_size = len(source.encode("utf-8")) if isinstance(source, str) else len(source)
    if encoded_size > max_bytes:
        raise ValueError(f"XML input cannot exceed {max_bytes} bytes.")
    root = DefusedElementTree.fromstring(
        source,
        forbid_dtd=True,
        forbid_entities=True,
        forbid_external=True,
    )
    _validate_tree_budget(
        root,
        max_nodes=max_nodes,
        max_depth=max_depth,
        max_text_chars=max_text_chars,
        max_attributes=max_attributes,
    )
    return root


def parse_xml_file(path: Path, *, max_bytes: int = MAX_XML_INPUT_BYTES) -> ET.Element:
    try:
        size = path.stat().st_size
        if size > max_bytes:
            raise ValueError(f"XML input cannot exceed {max_bytes} bytes.")
        with path.open("rb") as stream:
            source = stream.read(max_bytes + 1)
    except OSError:
        raise
    if len(source) > max_bytes:
        raise ValueError(f"XML input cannot exceed {max_bytes} bytes.")
    return parse_xml(source, max_bytes=max_bytes)


def _validate_tree_budget(
    root: ET.Element,
    *,
    max_nodes: int,
    max_depth: int,
    max_text_chars: int,
    max_attributes: int,
) -> None:
    nodes = 0
    attributes = 0
    text_chars = 0
    stack: list[tuple[ET.Element, int]] = [(root, 1)]
    while stack:
        element, depth = stack.pop()
        nodes += 1
        if nodes > max_nodes:
            raise ValueError(f"XML tree cannot exceed {max_nodes} nodes.")
        if depth > max_depth:
            raise ValueError(f"XML tree cannot exceed depth {max_depth}.")

        attributes += len(element.attrib)
        if attributes > max_attributes:
            raise ValueError(f"XML tree cannot exceed {max_attributes} attributes.")
        text_chars += len(element.text or "") + len(element.tail or "")
        text_chars += sum(len(name) + len(value) for name, value in element.attrib.items())
        if text_chars > max_text_chars:
            raise ValueError(f"XML text cannot exceed {max_text_chars} characters.")

        stack.extend((child, depth + 1) for child in reversed(list(element)))
