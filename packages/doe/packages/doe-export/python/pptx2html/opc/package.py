"""OpcPackage — the top-level OPC package reader.

Opens a ``.pptx`` file, parses its content types and relationship
graph, and provides access to its parts.
"""

from typing import IO, Optional, Union

from .constants import RELATIONSHIP_TYPE, CONTENT_TYPE
from .content_types import ContentTypeMap
from .exceptions import ContentTypeError, PartNotFoundError
from .packuri import PackURI, PACKAGE_URI, CONTENT_TYPES_URI
from .reader import ZipReader
from .rels import Relationship, Relationships
from .part import Part, PartFactory, XmlPart


class OpcPackage:
    """Represents an open OPC package (``.pptx`` file).

    Usage::

        pkg = OpcPackage.open("presentation.pptx")
        main = pkg.main_document_part
        for slide_part in pkg.slide_parts():
            print(slide_part)
    """

    def __init__(self, reader: ZipReader, content_type_map: ContentTypeMap):
        self._reader = reader
        self._content_type_map = content_type_map
        # Cache: PackURI → Part instance
        self._parts: dict[PackURI, Part] = {}
        # Cache: PackURI → Relationships (loaded on demand)
        self._rels_cache: dict[PackURI, Relationships] = {}
        # Package-level relationships
        self._package_rels: Optional[Relationships] = None
        # Main document part (cached after first lookup)
        self._main_document_part: Optional[Part] = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @classmethod
    def open(
        cls,
        path_or_stream: Union[str, bytes, IO[bytes]],
    ) -> "OpcPackage":
        """Open a ``.pptx`` file and return an ``OpcPackage`` instance."""
        reader = ZipReader(path_or_stream)
        content_types_xml = reader[CONTENT_TYPES_URI]
        content_type_map = ContentTypeMap.from_xml(content_types_xml)
        return cls(reader, content_type_map)

    @property
    def main_document_part(self) -> Part:
        """The presentation main document part (follows OFFICE_DOCUMENT rel)."""
        if self._main_document_part is None:
            pkg_rels = self._package_relationships()
            office_doc_rel = pkg_rels.find(RELATIONSHIP_TYPE.OFFICE_DOCUMENT)
            if office_doc_rel is None:
                raise PartNotFoundError(
                    "Package has no OFFICE_DOCUMENT relationship"
                )
            target_uri = PackURI.from_rel_ref(
                PACKAGE_URI, office_doc_rel.target
            )
            self._main_document_part = self._get_or_create_part(target_uri)
        return self._main_document_part

    def part(self, pack_uri: PackURI) -> Part:
        """Return the part at *pack_uri*, loading it if necessary."""
        return self._get_or_create_part(pack_uri)

    def parts_of_type(self, content_type: str) -> list[Part]:
        """Return all parts whose content type matches *content_type*.

        Note: this only returns parts that have already been loaded
        into the cache, plus the main document part.  For a full
        enumeration, consider iterating over *reader.namelist()* with
        ``part()`` calls.
        """
        return [
            p for p in self._parts.values() if p.content_type == content_type
        ]

    def slide_parts(self) -> list[Part]:
        """Return all slide parts by following the presentation's slide rels."""
        main = self.main_document_part
        return main.related_parts(RELATIONSHIP_TYPE.SLIDE)

    def slide_layout_parts(self) -> list[Part]:
        """Return all slide layout parts."""
        parts: set[Part] = set()
        for slide in self.slide_parts():
            layouts = slide.related_parts(RELATIONSHIP_TYPE.SLIDE_LAYOUT)
            parts.update(layouts)
        return list(parts)

    def slide_master_parts(self) -> list[Part]:
        """Return all slide master parts."""
        parts: set[Part] = set()
        for layout in self.slide_layout_parts():
            masters = layout.related_parts(RELATIONSHIP_TYPE.SLIDE_MASTER)
            parts.update(masters)
        return list(parts)

    def iter_all_parts(self) -> list[Part]:
        """Load and return all parts discovered via depth-first traversal.

        This forces the entire package to be read.
        """
        # Ensure package relationships are loaded
        self._package_relationships()
        return list(self._parts.values())

    def close(self) -> None:
        """Close the underlying ZIP reader."""
        self._reader.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    # ------------------------------------------------------------------
    # Internal helpers (called from Part.relationships)
    # ------------------------------------------------------------------

    def _load_relationships(self, source_uri: PackURI) -> Relationships:
        """Load relationships for *source_uri* (cached)."""
        if source_uri in self._rels_cache:
            return self._rels_cache[source_uri]

        rels_bytes = self._reader.rels_bytes_for(source_uri)
        if rels_bytes is None:
            rels = Relationships()
        else:
            rels = Relationships.from_xml_bytes(rels_bytes)

        self._rels_cache[source_uri] = rels

        # Resolve internal relationships to actual Part objects
        self._resolve_relationships(source_uri, rels)

        return rels

    def _resolve_relationships(
        self, source_uri: PackURI, rels: Relationships
    ) -> None:
        """Ensure that Part objects exist for all internal relationships."""
        for rel in rels:
            if rel.target_mode != "Internal":
                continue
            target_uri = PackURI.from_rel_ref(source_uri.base_uri, rel.target)
            if target_uri not in self._parts:
                self._get_or_create_part(target_uri)

    def _package_relationships(self) -> Relationships:
        """Load the package-level relationships (``/_rels/.rels``)."""
        if self._package_rels is None:
            self._package_rels = self._load_relationships(PACKAGE_URI)
        return self._package_rels

    def _get_or_create_part(self, pack_uri: PackURI) -> Part:
        """Return cached part or create from zip contents."""
        if pack_uri in self._parts:
            return self._parts[pack_uri]

        if pack_uri not in self._reader:
            raise PartNotFoundError(f"Part not found: {pack_uri}")

        blob = self._reader[pack_uri]
        try:
            content_type = self._content_type_map[pack_uri]
        except ContentTypeError:
            content_type = "application/octet-stream"

        part = PartFactory.create(pack_uri, content_type, blob, self)
        self._parts[pack_uri] = part
        return part
