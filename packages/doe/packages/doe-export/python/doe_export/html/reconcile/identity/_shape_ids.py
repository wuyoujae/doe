# Origin: pptx2html/htmlir/reconcile.py::_shape_ids
from __future__ import annotations
from doe_export.html.reconcile.shared import Any

def _shape_ids(shape: dict[str, Any]):
    shape_id = shape.get("shape_id")
    if isinstance(shape_id, int) and not isinstance(shape_id, bool):
        yield shape_id
    children = shape.get("shapes")
    if isinstance(children, list):
        for child in children:
            if isinstance(child, dict):
                yield from _shape_ids(child)

_shape_ids.__module__ = 'pptx2html.htmlir.reconcile'
