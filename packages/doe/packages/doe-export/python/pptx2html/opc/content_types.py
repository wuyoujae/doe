"""Content type map built from ``[Content_Types].xml``.

Resolves a part's PackURI to its content type string by consulting
``<Override>`` entries first, then falling back to ``<Default>``
entries (extension-based).
"""

from .constants import NAMESPACE, EXTENSION_TO_CONTENT_TYPE
from ..ooxml.safe_xml import parse_xml
from .exceptions import ContentTypeError
from .packuri import PackURI, CONTENT_TYPES_URI


# Build a default extension → content-type mapping from the
# OPC specification defaults plus our knowledge of common types.
_BUILTIN_DEFAULTS = dict(EXTENSION_TO_CONTENT_TYPE)

_NS = {
    "ct": NAMESPACE.OPC_CONTENT_TYPES,
}


class ContentTypeMap:
    """Maps a part PackURI to its content type string."""

    def __init__(self):
        self._overrides: dict[PackURI, str] = {}
        self._defaults: dict[str, str] = dict(_BUILTIN_DEFAULTS)

    @classmethod
    def from_xml(cls, xml_bytes: bytes) -> "ContentTypeMap":
        """Parse ``[Content_Types].xml`` and return a new ``ContentTypeMap``."""
        ctypemap = cls()

        root = parse_xml(xml_bytes)
        # <Override PartName="/ppt/slides/slide1.xml" ContentType="..."/>
        for override in root.findall("ct:Override", _NS):
            part_name = override.get("PartName", "")
            content_type = override.get("ContentType", "")
            if part_name and content_type:
                ctypemap._overrides[PackURI(part_name)] = content_type

        # <Default Extension="png" ContentType="image/png"/>
        for default in root.findall("ct:Default", _NS):
            ext = default.get("Extension", "").lower()
            content_type = default.get("ContentType", "")
            if ext and content_type:
                ctypemap._defaults[ext] = content_type

        return ctypemap

    def __getitem__(self, pack_uri: PackURI) -> str:
        """Return the content type for *pack_uri*.

        Checks overrides first, then falls back to extension-based
        defaults.  Raises ``ContentTypeError`` if no match is found.
        """
        # Override check (exact part name match)
        if pack_uri in self._overrides:
            return self._overrides[pack_uri]

        # Default check (extension match)
        ext = pack_uri.ext.lower()
        if ext in self._defaults:
            return self._defaults[ext]

        raise ContentTypeError(
            f"No content type found for {pack_uri} (extension: {ext!r})"
        )

    def __contains__(self, pack_uri: PackURI) -> bool:
        """Return ``True`` if a content type mapping exists for *pack_uri*."""
        try:
            self[pack_uri]
            return True
        except ContentTypeError:
            return False
