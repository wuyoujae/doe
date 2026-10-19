# Origin: pptx2html/htmlir/reconcile.py::_normalize_new_shape_ids
from __future__ import annotations
from doe_export.html.reconcile.shared import Any

def _normalize_new_shape_ids(
    shape: dict[str, Any],
    *,
    old_ids: set[int],
    seen_ids: set[int],
    next_shape_id: int,
    preserve_existing: bool,
) -> int:
    shape_id = shape.get("shape_id")
    valid_id = (
        isinstance(shape_id, int)
        and not isinstance(shape_id, bool)
        and shape_id > 0
    )
    if (
        not preserve_existing
        and (
            not valid_id
            or shape_id in old_ids
            or shape_id in seen_ids
        )
    ):
        while next_shape_id in old_ids or next_shape_id in seen_ids:
            next_shape_id += 1
        shape["shape_id"] = next_shape_id
        shape_id = next_shape_id
        next_shape_id += 1
    if isinstance(shape_id, int) and not isinstance(shape_id, bool):
        seen_ids.add(shape_id)
    children = shape.get("shapes")
    if isinstance(children, list):
        for child in children:
            if isinstance(child, dict):
                next_shape_id = _normalize_new_shape_ids(
                    child,
                    old_ids=old_ids,
                    seen_ids=seen_ids,
                    next_shape_id=next_shape_id,
                    preserve_existing=preserve_existing,
                )
    return next_shape_id

_normalize_new_shape_ids.__module__ = 'pptx2html.htmlir.reconcile'
