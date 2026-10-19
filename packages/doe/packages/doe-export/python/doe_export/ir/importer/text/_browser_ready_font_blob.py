# Origin: pptx2html/ir/builder.py::PresentationBuilder._browser_ready_font_blob
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, font_content_type_from_magic, struct

@staticmethod
def _browser_ready_font_blob(blob: bytes) -> Optional[tuple[str, bytes]]:
    if not blob:
        return None
    content_type = font_content_type_from_magic(blob)
    if content_type is not None:
        return content_type, blob
    if len(blob) >= 12:
        try:
            font_size = struct.unpack_from("<I", blob, 4)[0]
        except struct.error:
            font_size = 0
        offset = len(blob) - font_size
        if 0 <= offset < len(blob):
            font_blob = blob[offset:]
            content_type = font_content_type_from_magic(font_blob)
            if content_type is not None:
                return content_type, font_blob
    return None

_browser_ready_font_blob.__func__.__module__ = 'pptx2html.ir.builder'
_browser_ready_font_blob.__func__.__qualname__ = 'PresentationBuilder._browser_ready_font_blob'
