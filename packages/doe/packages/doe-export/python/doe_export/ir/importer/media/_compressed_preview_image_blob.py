# Origin: pptx2html/ir/builder.py::PresentationBuilder._compressed_preview_image_blob
from __future__ import annotations
from doe_export.ir.importer.shared import BytesIO, Image, ImageOps, Optional, _PREVIEW_IMAGE_MAX_PIXELS

@staticmethod
def _compressed_preview_image_blob(
    content_type: str,
    blob: bytes,
) -> tuple[Optional[str], Optional[bytes]]:
    """Build a 1600px WebP-76 preview while retaining original PPTX bytes."""

    if (
        Image is None
        or ImageOps is None
        or not blob
        or str(content_type or "").lower()
        not in {"image/jpeg", "image/png", "image/webp"}
    ):
        return None, None
    try:
        with Image.open(BytesIO(blob)) as source:
            if getattr(source, "n_frames", 1) > 1:
                return None, None
            width, height = source.size
            if (
                width <= 0
                or height <= 0
                or width * height > _PREVIEW_IMAGE_MAX_PIXELS
            ):
                return None, None
            if max(width, height) <= 1600 and len(blob) <= 2 * 1024 * 1024:
                return None, None
            image = ImageOps.exif_transpose(source)
            image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
            if image.mode not in {"RGB", "RGBA"}:
                has_alpha = (
                    "A" in image.getbands()
                    or "transparency" in getattr(image, "info", {})
                )
                image = image.convert("RGBA" if has_alpha else "RGB")
            output = BytesIO()
            image.save(output, format="WEBP", quality=76, method=4)
            preview = output.getvalue()
            if not preview or len(preview) >= len(blob):
                return None, None
            return "image/webp", preview
    except Exception:
        return None, None

_compressed_preview_image_blob.__func__.__module__ = 'pptx2html.ir.builder'
_compressed_preview_image_blob.__func__.__qualname__ = 'PresentationBuilder._compressed_preview_image_blob'
