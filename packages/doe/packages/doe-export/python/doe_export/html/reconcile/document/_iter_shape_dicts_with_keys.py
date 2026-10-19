# Origin: pptx2html/htmlir/reconcile.py::_iter_shape_dicts_with_keys
from __future__ import annotations
from doe_export.html.reconcile.shared import Any

def _iter_shape_dicts_with_keys(
    shapes: list[Any],
    parent_key: int | None = None,
    counter: list[int] | None = None,
):
    state = counter if counter is not None else [0]
    for shape in shapes:
        if not isinstance(shape, dict):
            continue
        shape_key = state[0]
        state[0] += 1
        yield shape_key, shape, parent_key
        children = shape.get("shapes")
        if isinstance(children, list):
            yield from _iter_shape_dicts_with_keys(children, shape_key, state)

_iter_shape_dicts_with_keys.__module__ = 'pptx2html.htmlir.reconcile'
