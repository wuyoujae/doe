# Origin: pptx_pipeline.py::_text_container_metrics
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import InvalidTextLayoutSnapshot, make_text_container_metrics

def _text_container_metrics(
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

_text_container_metrics.__module__ = 'pptx_pipeline'
