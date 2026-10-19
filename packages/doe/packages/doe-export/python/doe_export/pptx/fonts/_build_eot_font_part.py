# Origin: schema_v4_fonts.py::_build_eot_font_part
from __future__ import annotations
from .shared import Any, BytesIO, struct

def _build_eot_font_part(
    sfnt_bytes: bytes,
    metadata: dict[str, Any],
    *,
    subsetted: bool,
) -> bytes:
    names = (
        metadata["family"],
        metadata["style"],
        metadata["version_name"],
        metadata["full_name"],
    )
    encoded_names = [str(value or "").encode("utf-16le") for value in names]
    if any(len(value) > 0xFFFF for value in encoded_names):
        raise ValueError("Embedded font metadata exceeds EOT limits.")
    buffer = BytesIO()
    buffer.write(
        struct.pack(
            "<IIII",
            0,
            len(sfnt_bytes),
            0x00020002,
            0x1 if subsetted else 0,
        )
    )
    buffer.write(bytes(metadata["panose"])[:10].ljust(10, b"\0"))
    buffer.write(
        struct.pack(
            "<BBIHH",
            1,
            1 if metadata["italic"] else 0,
            int(metadata["weight"]),
            int(metadata["fs_type"]),
            0x504C,
        )
    )
    buffer.write(struct.pack("<4I", *metadata["unicode_ranges"]))
    buffer.write(struct.pack("<2I", *metadata["codepage_ranges"]))
    buffer.write(struct.pack("<I", int(metadata["checksum_adjustment"])))
    buffer.write(struct.pack("<4I", 0, 0, 0, 0))
    for encoded in encoded_names:
        buffer.write(struct.pack("<HH", 0, len(encoded)))
        buffer.write(encoded)
    buffer.write(struct.pack("<HHIIHHII", 0, 0, 0x50475342, 0, 0, 0, 0, 0))
    buffer.write(sfnt_bytes)
    result = bytearray(buffer.getvalue())
    struct.pack_into("<I", result, 0, len(result))
    return bytes(result)

_build_eot_font_part.__module__ = 'schema_v4_fonts'
