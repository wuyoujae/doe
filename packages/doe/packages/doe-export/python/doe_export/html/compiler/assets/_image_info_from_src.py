# Origin: pptx2html/htmlir/compiler.py::_image_info_from_src
from __future__ import annotations
from doe_export.html.compiler.shared import ImageInfo, base64, image_payload
from doe_export.html.compiler.assets._image_content_type import _image_content_type
from doe_export.html.compiler.assets._populate_image_intrinsic_size import _populate_image_intrinsic_size

def _image_info_from_src(src: str, alpha: float = 1.0) -> ImageInfo:
    raw = src.strip()
    normalized_alpha = alpha if alpha < 0.999 else None
    content_type = _image_content_type(raw)
    if raw.startswith(("http://", "https://")):
        try:
            payload, payload_type = image_payload({"url": raw, "content_type": content_type})
            image = ImageInfo(
                content_type=payload_type,
                data=base64.b64encode(payload).decode("ascii"),
                alpha=normalized_alpha,
            )
            _populate_image_intrinsic_size(image, payload)
            return image
        except Exception:
            return ImageInfo(content_type=content_type, url=raw, alpha=normalized_alpha)
    image = ImageInfo(content_type=content_type, url=raw, alpha=normalized_alpha)
    _populate_image_intrinsic_size(image)
    return image

_image_info_from_src.__module__ = 'pptx2html.htmlir.compiler'
