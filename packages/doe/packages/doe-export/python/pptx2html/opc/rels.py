"""Relationship and Relationships types for OPC ``.rels`` files.

A ``.rels`` file contains ``<Relationship>`` elements that define
directed edges from a source part (or the package root) to a target
part, identified by a relationship type URI and an ``rId`` string.
"""

import xml.etree.ElementTree as ET
from typing import Iterator

from .constants import NAMESPACE, TARGET_MODE
from ..ooxml.safe_xml import parse_xml
from .packuri import PackURI

_NS = {"r": NAMESPACE.OPC_RELATIONSHIPS}


class Relationship:
    """A single relationship entry from a ``.rels`` file.

    Attributes:
        rId: Relationship identifier (e.g. ``"rId1"``).
        reltype: Relationship type URI.
        target_mode: ``"Internal"`` or ``"External"``.
        target: Raw target string from the XML (relative path or URI).
    """

    __slots__ = ("rId", "reltype", "target_mode", "target")

    def __init__(
        self,
        rId: str,
        reltype: str,
        target: str,
        target_mode: str = TARGET_MODE.INTERNAL,
    ):
        self.rId = rId
        self.reltype = reltype
        self.target = target
        self.target_mode = target_mode

    @classmethod
    def from_xml(cls, element: ET.Element) -> "Relationship":
        """Parse a ``<Relationship>`` XML element."""
        rId = element.get("Id", "")
        reltype = element.get("Type", "")
        target = element.get("Target", "")
        target_mode = element.get("TargetMode", TARGET_MODE.INTERNAL)
        return cls(rId, reltype, target, target_mode)

    def __repr__(self) -> str:
        return (
            f"Relationship(rId={self.rId!r}, reltype={self.reltype!r}, "
            f"target={self.target!r}, target_mode={self.target_mode!r})"
        )


class Relationships:
    """A collection of ``Relationship`` objects from a single ``.rels`` file.

    Provides lookup by ``rId`` and filtering by relationship type.
    """

    def __init__(self):
        self._rels: dict[str, Relationship] = {}

    @classmethod
    def from_xml_bytes(cls, xml_bytes: bytes) -> "Relationships":
        """Parse a ``.rels`` XML document and return a ``Relationships``."""
        rels = cls()
        root = parse_xml(xml_bytes)
        for child in root.findall("r:Relationship", _NS):
            rel = Relationship.from_xml(child)
            rels._rels[rel.rId] = rel
        return rels

    def __getitem__(self, rId: str) -> Relationship:
        """Look up a relationship by its ``rId``."""
        return self._rels[rId]

    def __contains__(self, rId: str) -> bool:
        return rId in self._rels

    def __len__(self) -> int:
        return len(self._rels)

    def __iter__(self) -> Iterator[Relationship]:
        return iter(self._rels.values())

    def of_type(self, reltype: str) -> list[Relationship]:
        """Return all relationships with the given *reltype*."""
        return [r for r in self._rels.values() if r.reltype == reltype]

    def find(self, reltype: str) -> Relationship | None:
        """Return the first relationship matching *reltype*, or ``None``."""
        for r in self._rels.values():
            if r.reltype == reltype:
                return r
        return None

    @property
    def xml(self) -> str:
        """Serialize relationships back to XML (useful for round-tripping)."""
        lines = [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            f'<Relationships xmlns="{NAMESPACE.OPC_RELATIONSHIPS}">',
        ]
        for rel in self._rels.values():
            attrs = [
                f'Id="{rel.rId}"',
                f'Type="{rel.reltype}"',
                f'Target="{rel.target}"',
            ]
            if rel.target_mode != TARGET_MODE.INTERNAL:
                attrs.append(f'TargetMode="{rel.target_mode}"')
            lines.append(f"  <Relationship {' '.join(attrs)}/>")
        lines.append("</Relationships>")
        return "\n".join(lines)

    def add(self, relationship: Relationship) -> None:
        """Add a relationship to the collection."""
        self._rels[relationship.rId] = relationship
