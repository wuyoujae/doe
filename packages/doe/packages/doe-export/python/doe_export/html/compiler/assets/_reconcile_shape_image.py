# Origin: pptx2html/htmlir/compiler.py::_reconcile_shape_image
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Shape
from doe_export.html.compiler.shared import math, re
from doe_export.html.compiler.assets._apply_stable_image_fit import _apply_stable_image_fit
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._element_opacity import _element_opacity
from doe_export.html.compiler.assets._image_content_type import _image_content_type
from doe_export.html.compiler.assets._managed_image_asset_id import _managed_image_asset_id
from doe_export.html.compiler.structure._shape_descendant_nodes import _shape_descendant_nodes

def _reconcile_shape_image(
    shape: Shape,
    root_node: dict[str, Any],
    nodes: list[dict[str, Any]],
    shape_paths: set[str],
) -> bool:
    image = shape.image
    if image is None and shape.fill is not None and shape.fill.type == "picture":
        image = shape.fill.image
    if image is None:
        return True
    image_nodes = [
        node
        for node in _shape_descendant_nodes(root_node, nodes, shape_paths)
        if str(node.get("tag") or "").lower() == "img"
    ]
    # Tiled/picture-fill Canonical projections do not contain an <img>. Their
    # image operations are rejected by the Copyist selector and remain intact.
    if not image_nodes:
        return True
    if len(image_nodes) != 1:
        return False
    image_node = image_nodes[0]
    attrs = (
        image_node.get("attributes")
        if isinstance(image_node.get("attributes"), dict)
        else {}
    )
    src = attrs.get("src")
    if not isinstance(src, str) or not src.strip():
        return False
    src = src.strip()
    old_asset_id = _managed_image_asset_id(image.data or image.url or "")
    new_asset_id = _managed_image_asset_id(src)
    if new_asset_id is None:
        return False
    if new_asset_id != old_asset_id:
        content_type = _image_content_type(src)
        image.content_type = content_type
        image.data = f"yrkie-asset-base64://{new_asset_id}"
        image.url = None
        image.preview_content_type = None
        image.preview_data = None
        image.intrinsic_width_pt = None
        image.intrinsic_height_pt = None

    computed = _computed(image_node)
    alpha = _element_opacity(root_node) * _element_opacity(image_node)
    image.alpha = alpha if alpha < 0.999 else None

    explicit_crop = []
    for name in ("left", "top", "right", "bottom"):
        raw = attrs.get(f"data-crop-{name}")
        if raw is None:
            explicit_crop = []
            break
        value = _css_float(raw, math.nan)
        if not math.isfinite(value):
            return False
        explicit_crop.append(max(0.0, min(0.999, value / 100.0)))
    if explicit_crop:
        (
            image.crop_left,
            image.crop_top,
            image.crop_right,
            image.crop_bottom,
        ) = explicit_crop

    inline_style = str(attrs.get("style") or "")
    fit_match = re.search(
        r"(?:^|;)\s*object-fit\s*:\s*([^;]+)",
        inline_style,
        flags=re.IGNORECASE,
    )
    if fit_match is not None:
        fit = fit_match.group(1).strip().lower()
        if fit not in {"cover", "contain", "fill", "none", "scale-down"}:
            return False
        _apply_stable_image_fit(image, image_node, shape.bounds, fit)
        # An explicit crop operation is authoritative over object-fit.
        if explicit_crop:
            (
                image.crop_left,
                image.crop_top,
                image.crop_right,
                image.crop_bottom,
            ) = explicit_crop
    return True

_reconcile_shape_image.__module__ = 'pptx2html.htmlir.compiler'
