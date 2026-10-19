# Origin: pptx2html/server/pptx_writer.py::_add_image_part
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import Path, tempfile
from doe_export.pptx.writer.assets._image_suffix import _image_suffix
from doe_export.pptx.writer.package._source_free_export_ready_image_payload import _source_free_export_ready_image_payload

def _add_image_part(slide, image: dict[str, Any]) -> str:
    data, content_type = _source_free_export_ready_image_payload(image)
    suffix = _image_suffix(content_type)
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as handle:
        handle.write(data)
        temp_path = Path(handle.name)
    try:
        _image_part, rel_id = slide.part.get_or_add_image_part(str(temp_path))
        return rel_id
    finally:
        try:
            temp_path.unlink(missing_ok=True)
        except OSError:
            pass

_add_image_part.__module__ = 'pptx2html.server.pptx_writer'
