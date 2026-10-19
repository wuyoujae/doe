# Origin: pptx2html/htmlir/reconcile.py::_restore_composed_picture_metadata
from __future__ import annotations
from doe_export.html.reconcile.shared import Any, copy, normalize_transient_asset_payloads, re
from doe_export.html.reconcile.assets._composed_svg_uses_source_asset import _composed_svg_uses_source_asset

def _restore_composed_picture_metadata(
    previous: dict[str, Any],
    reconciled: dict[str, Any],
    asset_payloads: dict[str, Any],
) -> dict[str, Any]:
    """Keep source image semantics when CSS used a derived composed SVG."""

    assets = normalize_transient_asset_payloads(asset_payloads)
    restored = copy.deepcopy(reconciled)

    def restore_image(old_image: Any, new_image: Any) -> None:
        if not isinstance(old_image, dict) or not isinstance(new_image, dict):
            return
        old_data = str(old_image.get("data") or "")
        match = re.fullmatch(
            r"yrkie-asset-base64://(?P<asset_id>[0-9a-fA-F]{64})",
            old_data,
        )
        if match is None:
            return
        if _composed_svg_uses_source_asset(
            new_image,
            match.group("asset_id").lower(),
            assets,
        ):
            new_image.clear()
            new_image.update(copy.deepcopy(old_image))

    def restore_shape(old_shape: Any, new_shape: Any) -> None:
        if not isinstance(old_shape, dict) or not isinstance(new_shape, dict):
            return
        restore_image(old_shape.get("image"), new_shape.get("image"))
        old_fill = old_shape.get("fill")
        new_fill = new_shape.get("fill")
        if isinstance(old_fill, dict) and isinstance(new_fill, dict):
            restore_image(old_fill.get("image"), new_fill.get("image"))
        old_children = old_shape.get("shapes")
        new_children = new_shape.get("shapes")
        if isinstance(old_children, list) and isinstance(new_children, list):
            restore_shape_list(old_children, new_children)

    def restore_shape_list(old_shapes: list[Any], new_shapes: list[Any]) -> None:
        old_by_id = {
            item.get("shape_id"): item
            for item in old_shapes
            if isinstance(item, dict) and item.get("shape_id") is not None
        }
        for position, new_shape in enumerate(new_shapes):
            if not isinstance(new_shape, dict):
                continue
            old_shape = old_by_id.get(new_shape.get("shape_id"))
            if old_shape is None and position < len(old_shapes):
                old_shape = old_shapes[position]
            restore_shape(old_shape, new_shape)

    old_slides = previous.get("slides")
    new_slides = restored.get("slides")
    if isinstance(old_slides, list) and isinstance(new_slides, list):
        for old_slide, new_slide in zip(old_slides, new_slides):
            if not isinstance(old_slide, dict) or not isinstance(new_slide, dict):
                continue
            old_shapes = old_slide.get("shapes")
            new_shapes = new_slide.get("shapes")
            if isinstance(old_shapes, list) and isinstance(new_shapes, list):
                restore_shape_list(old_shapes, new_shapes)
    return restored

_restore_composed_picture_metadata.__module__ = 'pptx2html.htmlir.reconcile'
