# Origin: pptx2html/server/pptx_writer.py::_source_free_export_ready_image_payload
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import export_ready_image_payload
from doe_export.pptx.writer.geometry._rasterize_static_svg import _rasterize_static_svg

def _source_free_export_ready_image_payload(image: dict[str, Any]) -> tuple[bytes, str]:
    data, content_type = export_ready_image_payload(image)
    if content_type != "image/svg+xml":
        return data, content_type
    return _rasterize_static_svg(data), "image/png"

_source_free_export_ready_image_payload.__module__ = 'pptx2html.server.pptx_writer'
