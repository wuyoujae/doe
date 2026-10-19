# Portions adapted from python-pptx v1.0.2 (MIT).
# Copyright (c) 2013 Steve Canny, https://github.com/scanny
# See licenses/python-pptx-MIT.txt and the export module README.
"""PackURI value type representing OPC part names.

A PackURI is a string that starts with "/" and follows the OPC
pack URI naming conventions (e.g. "/ppt/slides/slide1.xml").
"""

import posixpath
import re

from .exceptions import InvalidPackURIError


class PackURI(str):
    """A validated OPC pack URI (part name).

    Behaves as a normal str but provides utility properties for
    navigating the package part hierarchy.
    """

    _filename_re = re.compile(r"([a-zA-Z]+)([0-9][0-9]*)?")

    def __new__(cls, pack_uri_str: str) -> "PackURI":
        if not pack_uri_str.startswith("/"):
            raise InvalidPackURIError(
                f"PackURI must begin with '/', got {pack_uri_str!r}"
            )
        return str.__new__(cls, pack_uri_str)

    @staticmethod
    def from_rel_ref(base_uri: str, relative_ref: str) -> "PackURI":
        """Resolve a *relative_ref* against *base_uri* to form an absolute PackURI."""
        joined = posixpath.join(base_uri, relative_ref)
        absolute = posixpath.abspath(joined)
        return PackURI(absolute)

    @property
    def base_uri(self) -> str:
        """The directory portion of this pack URI.

        E.g. ``"/ppt/slides"`` for ``"/ppt/slides/slide1.xml"``.
        Returns ``"/"`` for the package root.
        """
        return posixpath.split(self)[0]

    @property
    def ext(self) -> str:
        """File extension without the leading dot. E.g. ``"xml"``."""
        raw = posixpath.splitext(self)[1]
        return raw[1:] if raw.startswith(".") else raw

    @property
    def filename(self) -> str:
        """The filename portion. E.g. ``"slide1.xml"``."""
        return posixpath.split(self)[1]

    @property
    def membername(self) -> str:
        """The zip member name (leading slash stripped).

        Returns ``""`` for the package root ``"/"``.
        """
        return self[1:]

    @property
    def idx(self) -> int | None:
        """Numeric index extracted from the filename, if any.

        E.g. ``21`` for ``"/ppt/slides/slide21.xml"``, ``None`` for
        ``"/ppt/presentation.xml"``.
        """
        name_part = posixpath.splitext(self.filename)[0]
        match = self._filename_re.match(name_part)
        if match and match.group(2):
            return int(match.group(2))
        return None

    def relative_ref(self, base_uri: str) -> str:
        """Return relative reference from *base_uri* to *self*."""
        if base_uri == "/":
            return self.membername
        return posixpath.relpath(self, base_uri)

    @property
    def rels_uri(self) -> "PackURI":
        """PackURI of the corresponding ``.rels`` part."""
        rels_filename = f"{self.filename}.rels"
        rels_uri_str = posixpath.join(self.base_uri, "_rels", rels_filename)
        return PackURI(rels_uri_str)


# Well-known pack URIs
PACKAGE_URI = PackURI("/")
CONTENT_TYPES_URI = PackURI("/[Content_Types].xml")
