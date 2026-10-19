# Origin: pptx2html/htmlir/compiler.py::_layout_item_right_limit
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import SLIDE_HEIGHT, SLIDE_WIDTH, _parent_path
from doe_export.html.compiler.geometry._bounds_from_node import _bounds_from_node
from doe_export.html.compiler.geometry._bounds_overlap_y import _bounds_overlap_y
from doe_export.html.compiler.geometry._bounds_right import _bounds_right
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.document._is_flex_display import _is_flex_display
from doe_export.html.compiler.document._is_grid_display import _is_grid_display
from doe_export.html.compiler.document._layout_content_right import _layout_content_right
from doe_export.html.compiler.document._parent_path import _parent_path

def _layout_item_right_limit(
    node: dict[str, Any],
    nodes_by_path: dict[str, dict[str, Any]],
    sx: float,
    sy: float,
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> float | None:
    path = str(node.get("path") or "")
    original_bounds = _bounds_from_node(node, sx, sy, canvas_size)
    own_right = _bounds_right(original_bounds) if original_bounds is not None else 0.0
    current_path = path
    best_limit: float | None = None
    hard_limit = canvas_size[0]
    while current_path:
        parent_path = _parent_path(current_path)
        if not parent_path:
            break
        parent = nodes_by_path.get(parent_path)
        if parent is not None and (_is_flex_display(_computed(parent)) or _is_grid_display(_computed(parent))):
            item = nodes_by_path.get(current_path) or node
            item_bounds = _bounds_from_node(item, sx, sy, canvas_size)
            parent_bounds = _bounds_from_node(parent, sx, sy, canvas_size)
            if item_bounds is None or item_bounds.width <= 0 or parent_bounds is None:
                current_path = parent_path
                continue
            if str(_computed(item).get("position") or "static").strip().lower() in {"absolute", "fixed"}:
                return _bounds_right(item_bounds)

            parent_computed = _computed(parent)
            parent_right = _layout_content_right(parent_bounds, parent_computed, sx)
            overflow_x = str(parent_computed.get("overflowX") or parent_computed.get("overflow") or "visible").strip().lower()
            if overflow_x not in {"", "visible"}:
                hard_limit = min(hard_limit, parent_right)
            use_horizontal_siblings = _is_grid_display(parent_computed)
            if use_horizontal_siblings:
                # The snapshot does not expose resolved grid track edges.
                # Treat the grid item's own box as the conservative track cap.
                hard_limit = min(hard_limit, _bounds_right(item_bounds))
            if _is_flex_display(parent_computed):
                direction = str(parent_computed.get("flexDirection") or "row").strip().lower()
                use_horizontal_siblings = direction in {"row", "row-reverse"}
            if use_horizontal_siblings:
                sibling_lefts: list[float] = []
                for sibling_path, sibling in nodes_by_path.items():
                    if sibling_path == current_path or _parent_path(sibling_path) != parent_path:
                        continue
                    if not sibling.get("visible"):
                        continue
                    sibling_bounds = _bounds_from_node(sibling, sx, sy, canvas_size)
                    if (
                        sibling_bounds is not None
                        and sibling_bounds.left > item_bounds.left + 0.25
                        and _bounds_overlap_y(item_bounds, sibling_bounds)
                    ):
                        sibling_lefts.append(sibling_bounds.left)
                if sibling_lefts:
                    parent_right = min(parent_right, min(sibling_lefts))
                    hard_limit = min(hard_limit, parent_right)
            candidate = max(_bounds_right(item_bounds), parent_right)
            # Auto-sized nested flex columns may be only as wide as their text.
            # With visible overflow, a wider ancestor is safe free space; clipped
            # ancestors and horizontal siblings remain hard intersection limits.
            best_limit = candidate if best_limit is None else max(best_limit, candidate)
        current_path = parent_path
    if best_limit is None:
        return None
    return max(own_right, min(best_limit, hard_limit))

_layout_item_right_limit.__module__ = 'pptx2html.htmlir.compiler'
