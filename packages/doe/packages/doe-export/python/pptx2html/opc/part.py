"""Part and XmlPart classes representing items in an OPC package.

Each part has a PackURI, a content type, and a blob of bytes.
``XmlPart`` additionally parses the blob as XML on demand.
"""

import xml.etree.ElementTree as ET
from typing import TYPE_CHECKING, Optional

from .content_types import ContentTypeMap
from ..ooxml.safe_xml import parse_xml
from .packuri import PackURI, PACKAGE_URI
from .reader import ZipReader
from .rels import Relationships, Relationship

if TYPE_CHECKING:
    from .package import OpcPackage


class Part:
    """A part within an OPC package.

    Attributes:
        pack_uri: The part's absolute PackURI.
        content_type: The part's MIME type string.
        blob: The raw bytes of the part.
        package: The owning ``OpcPackage`` instance.
    """

    def __init__(
        self,
        pack_uri: PackURI,
        content_type: str,
        blob: bytes,
        package: "OpcPackage",
    ):
        self._pack_uri = pack_uri
        self._content_type = content_type
        self._blob = blob
        self._package = package
        self._relationships: Optional[Relationships] = None

    @property
    def pack_uri(self) -> PackURI:
        return self._pack_uri

    @property
    def content_type(self) -> str:
        return self._content_type

    @property
    def blob(self) -> bytes:
        return self._blob

    @blob.setter
    def blob(self, value: bytes) -> None:
        self._blob = value

    @property
    def package(self) -> "OpcPackage":
        return self._package

    @property
    def relationships(self) -> Relationships:
        """Lazily load and return this part's relationships."""
        if self._relationships is None:
            self._relationships = self._package._load_relationships(self._pack_uri)
        return self._relationships

    def related_part(self, reltype: str) -> Optional["Part"]:
        """Return the first related part matching *reltype*, or ``None``."""
        rel = self.relationships.find(reltype)
        if rel is None or rel.target_mode != "Internal":
            return None
        target_uri = PackURI.from_rel_ref(self._pack_uri.base_uri, rel.target)
        try:
            return self._package.part(target_uri)
        except KeyError:
            return None

    def related_parts(self, reltype: str) -> list["Part"]:
        """Return all related parts matching *reltype*."""
        results: list[Part] = []
        for rel in self.relationships.of_type(reltype):
            if rel.target_mode != "Internal":
                continue
            target_uri = PackURI.from_rel_ref(self._pack_uri.base_uri, rel.target)
            try:
                results.append(self._package.part(target_uri))
            except KeyError:
                pass
        return results

    def __repr__(self) -> str:
        return (
            f"Part(pack_uri={self._pack_uri!r}, "
            f"content_type={self._content_type!r})"
        )


class XmlPart(Part):
    """A ``Part`` whose blob is XML content.

    Provides an ``element`` property that lazily parses the XML
    blob into an ``xml.etree.ElementTree.Element``.
    """

    def __init__(
        self,
        pack_uri: PackURI,
        content_type: str,
        blob: bytes,
        package: "OpcPackage",
    ):
        super().__init__(pack_uri, content_type, blob, package)
        self._element: Optional[ET.Element] = None

    @property
    def element(self) -> ET.Element:
        """The root ``Element`` of the parsed XML (lazily loaded)."""
        if self._element is None:
            self._element = parse_xml(self._blob)
        return self._element

    @element.setter
    def element(self, value: ET.Element) -> None:
        self._element = value
        # Invalidate cached blob so it gets re-serialized if needed
        self._blob = ET.tostring(value, xml_declaration=True, encoding="UTF-8")

    @Part.blob.getter
    def blob(self) -> bytes:
        if self._element is not None:
            self._blob = ET.tostring(
                self._element, xml_declaration=True, encoding="UTF-8", standalone=True
            )
        return self._blob


class PartFactory:
    """Creates ``Part`` (or ``Part`` subclass) instances by content type.

    Callers register content-type → class mappings, then use
    ``create()`` to dispatch.
    """

    _registry: dict[str, type[Part]] = {}

    @classmethod
    def register(cls, content_type: str, part_cls: type[Part]) -> None:
        """Register *part_cls* as the class to use for *content_type*."""
        cls._registry[content_type] = part_cls

    @classmethod
    def create(
        cls,
        pack_uri: PackURI,
        content_type: str,
        blob: bytes,
        package: "OpcPackage",
    ) -> Part:
        """Return a ``Part`` (or subclass) instance for the given parameters."""
        part_cls = cls._registry.get(content_type)
        if part_cls is not None:
            return part_cls(pack_uri, content_type, blob, package)
        # Default: use XmlPart for XML content, Part for everything else
        if content_type.endswith("+xml") or content_type in (
            "application/xml",
            "application/vnd.openxmlformats-package.core-properties+xml",
        ):
            return XmlPart(pack_uri, content_type, blob, package)
        return Part(pack_uri, content_type, blob, package)
