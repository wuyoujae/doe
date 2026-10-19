# Origin: pptx2html/server/pptx_writer.py::_text_container_metrics
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import InvalidTextLayoutSnapshot, make_text_container_metrics

def _text_container_metrics(
    width_pt: Any,
    height_pt: Any,
    *,
    kind: str = "shape",
    cell_margins: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    try:
        return make_text_container_metrics(
            width_pt,
            height_pt,
            kind=kind,
            cell_margins=cell_margins,
        )
    except InvalidTextLayoutSnapshot:
        return None

_text_container_metrics.__module__ = 'pptx2html.server.pptx_writer'
