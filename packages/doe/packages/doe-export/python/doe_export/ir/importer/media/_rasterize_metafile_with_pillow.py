# Origin: pptx2html/ir/builder.py::PresentationBuilder._rasterize_metafile_with_pillow
from __future__ import annotations
from doe_export.ir.importer.shared import BytesIO, Image, Optional

@staticmethod
def _rasterize_metafile_with_pillow(blob: bytes) -> Optional[tuple[str, bytes]]:
    if Image is None:
        return None
    try:
        with Image.open(BytesIO(blob)) as image:
            if image.mode not in {"RGB", "RGBA"}:
                image = image.convert("RGBA")
            output = BytesIO()
            image.save(output, format="PNG")
            return "image/png", output.getvalue()
    except Exception:
        return None

_rasterize_metafile_with_pillow.__func__.__module__ = 'pptx2html.ir.builder'
_rasterize_metafile_with_pillow.__func__.__qualname__ = 'PresentationBuilder._rasterize_metafile_with_pillow'
