# Origin: pptx2html/server/ooxml_pptx_writer.py::_make_text_container_metrics
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import InvalidTextLayoutSnapshot, make_text_container_metrics

def _make_text_container_metrics(
    width: Any,
    height: Any,
    *,
    kind: str = "shape",
    cell_margins: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    try:
        return make_text_container_metrics(
            width,
            height,
            kind=kind,
            cell_margins=cell_margins,
        )
    except InvalidTextLayoutSnapshot:
        return None

_make_text_container_metrics.__module__ = 'pptx2html.server.ooxml_pptx_writer'
