"""Physical ZIP reader for OPC packages.

Provides low-level access to the raw bytes of parts stored in a
.pptx (ZIP) file.
"""

import zipfile
from typing import IO, Union

from .archive_guard import read_archive_entry, validate_pptx_archive
from .exceptions import PackageNotFoundError
from .packuri import PackURI


class ZipReader:
    """Reads the raw bytes of parts from a ZIP-based OPC package.

    Supports both file paths and file-like objects via dependency
    injection of *zipfile_class* (useful for testing with in-memory
    archives).
    """

    def __init__(
        self,
        path_or_stream: Union[str, bytes, IO[bytes]],
        zipfile_class=None,
    ):
        if zipfile_class is None:
            zipfile_class = zipfile.ZipFile
        try:
            self._zip = zipfile_class(path_or_stream, "r")
            self._entries = validate_pptx_archive(self._zip)
        except (FileNotFoundError, zipfile.BadZipFile) as exc:
            raise PackageNotFoundError(
                f"Cannot open package: {exc}"
            ) from exc

    def __getitem__(self, pack_uri: PackURI) -> bytes:
        """Return the raw bytes for the part identified by *pack_uri*."""
        try:
            return read_archive_entry(self._zip, self._entries[pack_uri.membername])
        except KeyError as exc:
            raise KeyError(
                f"Part not found in package: {pack_uri}"
            ) from exc

    def __contains__(self, pack_uri: PackURI) -> bool:
        """Return ``True`` if a part with *pack_uri* exists."""
        return pack_uri.membername in self._entries

    def rels_bytes_for(self, pack_uri: PackURI) -> bytes | None:
        """Return the raw bytes of the ``.rels`` part for *pack_uri*.

        Returns ``None`` if no ``.rels`` part exists.
        """
        rels_uri = pack_uri.rels_uri
        if rels_uri.membername not in self._entries:
            return None
        return read_archive_entry(self._zip, self._entries[rels_uri.membername])

    def namelist(self) -> list[str]:
        """List all member names in the ZIP archive."""
        return list(self._entries)

    def close(self) -> None:
        """Close the underlying ZIP archive."""
        self._zip.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
