# Origin: pptx2html/htmlir/compiler.py::_clip_mask_for_node
from __future__ import annotations
from doe_export.html.compiler.geometry._HtmlClipMask import _HtmlClipMask
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.geometry._bounds_contains import _bounds_contains
from doe_export.html.compiler.geometry._bounds_nearly_equal import _bounds_nearly_equal
from doe_export.html.compiler.document._path_is_descendant import _path_is_descendant

def _clip_mask_for_node(path: str, bounds: Bounds, masks: list[_HtmlClipMask]) -> _HtmlClipMask | None:
    if not path or not masks:
        return None
    candidates = [
        mask
        for mask in masks
        if _path_is_descendant(path, mask.path)
        and (_bounds_nearly_equal(bounds, mask.bounds) or _bounds_contains(bounds, mask.bounds))
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda mask: len(mask.path))

_clip_mask_for_node.__module__ = 'pptx2html.htmlir.compiler'
