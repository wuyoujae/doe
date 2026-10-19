# Origin: pptx2html/htmlir/reconcile.py::_restore_unknown_metadata
from __future__ import annotations
from doe_export.html.reconcile.shared import Any, copy

def _restore_unknown_metadata(
    previous: dict[str, Any],
    reconciled: dict[str, Any],
) -> dict[str, Any]:
    """Restore only keys the typed IR serializer does not know about."""

    restored = copy.deepcopy(reconciled)

    def visit(old: Any, new: Any) -> None:
        if isinstance(old, dict) and isinstance(new, dict):
            for key, old_value in old.items():
                if key not in new:
                    new[key] = copy.deepcopy(old_value)
                    continue
                visit(old_value, new[key])
        elif isinstance(old, list) and isinstance(new, list):
            old_by_shape_id = {
                item.get("shape_id"): item
                for item in old
                if isinstance(item, dict)
                and isinstance(item.get("shape_id"), int)
                and not isinstance(item.get("shape_id"), bool)
            }
            new_shape_ids = [
                item.get("shape_id")
                for item in new
                if isinstance(item, dict)
                and isinstance(item.get("shape_id"), int)
                and not isinstance(item.get("shape_id"), bool)
            ]
            if old_by_shape_id and new_shape_ids:
                for new_item in new:
                    if not isinstance(new_item, dict):
                        continue
                    old_item = old_by_shape_id.get(new_item.get("shape_id"))
                    if old_item is not None:
                        visit(old_item, new_item)
                return
            for old_item, new_item in zip(old, new):
                visit(old_item, new_item)

    visit(previous, restored)
    return restored

_restore_unknown_metadata.__module__ = 'pptx2html.htmlir.reconcile'
