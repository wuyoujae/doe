# Origin: pptx2html/ir/builder.py::PresentationBuilder._browser_ready_image_blob
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

def _browser_ready_image_blob(
    self,
    content_type: str,
    blob: bytes,
    membername: Optional[str] = None,
) -> tuple[str, bytes]:
    if not blob:
        return content_type or "image/png", blob
    if self._is_svg_image(content_type, membername):
        return content_type or "image/svg+xml", self._normalize_svg_intrinsic_size(blob)
    if not self._is_metafile_image(content_type, membername):
        return content_type or "image/png", blob
    converted = self._rasterize_metafile(content_type, blob, membername)
    if converted is None:
        return content_type or "image/png", blob
    return converted

_browser_ready_image_blob.__module__ = 'pptx2html.ir.builder'
_browser_ready_image_blob.__qualname__ = 'PresentationBuilder._browser_ready_image_blob'
