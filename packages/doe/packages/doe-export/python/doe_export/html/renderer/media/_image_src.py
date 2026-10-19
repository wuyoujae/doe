# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._image_src
from __future__ import annotations
from doe_export.html.renderer.shared import base64, os

def _image_src(self, image) -> str:
    preview_data = str(getattr(image, "preview_data", "") or "").strip()
    if preview_data.startswith("yrkie-asset-base64://"):
        return preview_data.replace("yrkie-asset-base64://", "yrkie-asset-data://", 1)
    if preview_data.startswith(("yrkie-asset-data://", "data:")):
        return preview_data
    if preview_data:
        preview_type = str(
            getattr(image, "preview_content_type", None)
            or "image/webp"
        )
        return f"data:{preview_type};base64,{preview_data}"
    image_data = str(getattr(image, "data", "") or "").strip()
    if image_data.startswith("yrkie-asset-base64://"):
        return image_data.replace("yrkie-asset-base64://", "yrkie-asset-data://", 1)
    if image_data.startswith(("yrkie-asset-data://", "data:")):
        return image_data
    if not image_data and getattr(image, "url", None):
        return image.url
    if not image_data:
        return ""
    raw = self._image_bytes(image)
    if self._mode == "file":
        ext = self._ext_from_content_type(image.content_type)
        self._image_counter += 1
        filename = f"image{self._image_counter}{ext}"
        write_dir = self._media_write_dir or self._media_dir
        src_dir = self._media_src_dir or self._media_dir
        media_path = os.path.join(write_dir, filename)
        os.makedirs(os.path.dirname(media_path), exist_ok=True)
        with open(media_path, "wb") as f:
            f.write(raw)
        return os.path.join(src_dir, filename).replace("\\", "/")
    else:
        data = base64.b64encode(raw).decode("ascii")
        return f"data:{image.content_type};base64,{data}"

_image_src.__module__ = 'pptx2html.renderer.html_renderer'
_image_src.__qualname__ = 'HtmlRenderer._image_src'
