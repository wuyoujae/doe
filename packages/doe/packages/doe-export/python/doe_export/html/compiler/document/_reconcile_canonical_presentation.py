# Origin: pptx2html/htmlir/compiler.py::_reconcile_canonical_presentation
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Presentation
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.geometry._bounds_nearly_equal import _bounds_nearly_equal
from doe_export.html.compiler.typography._canonical_inline_bounds import _canonical_inline_bounds
from doe_export.html.compiler.document._canonical_payload_presentation import _canonical_payload_presentation
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.structure._iter_indexed_ir_shapes import _iter_indexed_ir_shapes
from doe_export.html.compiler.structure._iter_ir_shapes import _iter_ir_shapes
from doe_export.html.compiler.assets._reconcile_shape_image import _reconcile_shape_image
from doe_export.html.compiler.typography._reconcile_shape_paragraphs import _reconcile_shape_paragraphs
from doe_export.html.compiler.structure._reconcile_shape_runs import _reconcile_shape_runs
from doe_export.html.compiler.css._reconcile_shape_style import _reconcile_shape_style
from doe_export.html.compiler.structure._reconcile_shape_table import _reconcile_shape_table

def _reconcile_canonical_presentation(
    source: str,
    nodes: list[dict[str, Any]],
    slide_nodes: list[dict[str, Any]],
    slide_index: int,
) -> tuple[Presentation, int] | None:
    presentation = _canonical_payload_presentation(source)
    if presentation is None or len(presentation.slides) != len(slide_nodes):
        return None
    inspected = 0
    for order, (slide, slide_node) in enumerate(zip(presentation.slides, slide_nodes, strict=True)):
        slide.index = slide_index + order
        slide_path = str(slide_node.get("path") or "")
        slide_rect = slide_node.get("rect") if isinstance(slide_node.get("rect"), dict) else {}
        slide_left = _css_float(slide_rect.get("left"), 0.0)
        slide_top = _css_float(slide_rect.get("top"), 0.0)
        slide_width_px = max(1.0, _css_float(slide_rect.get("width"), 1280.0))
        slide_height_px = max(1.0, _css_float(slide_rect.get("height"), 720.0))
        layer_paths = {
            str(node.get("path") or "")
            for node in nodes
            if str(node.get("path") or "").startswith(slide_path + " > ")
            and isinstance(node.get("attributes"), dict)
            and str(node["attributes"].get("data-pptx2html-layer") or "") == "1"
        }
        shape_nodes = []
        for node in nodes:
            path = str(node.get("path") or "")
            if not path.startswith(slide_path + " > "):
                continue
            attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
            has_shape_marker = bool(
                str(attrs.get("data-pptx-shape-key") or "").strip()
                or str(attrs.get("data-pptx-shape-id") or "").strip()
            )
            class_names = {
                value.strip().lower()
                for value in str(attrs.get("class") or "").split()
                if value.strip()
            }
            if "pptx-shape" in class_names and not has_shape_marker:
                # An AI-edited canonical document may add visible shape DOM
                # without updating the embedded IR. Reconciliation cannot
                # preserve that new content, so rebuild the slide semantically.
                return None
            if (
                not has_shape_marker
                and str(attrs.get("data-yrkie-element-id") or "").strip()
            ):
                # A stable id that is absent from the Canonical payload is an
                # authored structural edit, including additions nested inside
                # an existing shape. It must enter semantic fallback instead
                # of being silently discarded by the stable merge.
                return None
            parent_path = path.rsplit(" > ", 1)[0] if " > " in path else ""
            if parent_path in layer_paths and not has_shape_marker:
                # Canonical renderer output contains managed shape wrappers as
                # direct layer children. Raw authored/Tailwind DOM here means
                # the payload is not a complete representation of the slide.
                return None
            if has_shape_marker:
                shape_nodes.append(node)
        shape_paths = {str(node.get("path") or "") for node in shape_nodes}
        indexed_shapes = list(_iter_indexed_ir_shapes(slide.shapes))
        flattened_shapes = [item[1] for item in indexed_shapes]
        old_parent_by_key = {
            shape_key: parent_key
            for shape_key, _shape, parent_key in indexed_shapes
        }
        shape_keys: set[int] = set()
        shape_key_order: list[int] = []
        parent_key_by_shape_key: dict[int, int | None] = {}
        shape_by_path: dict[str, Shape] = {}
        shape_key_by_path: dict[str, int] = {}
        shape_node_by_path = {
            str(candidate.get("path") or ""): candidate
            for candidate in shape_nodes
        }
        for node_index, node in enumerate(shape_nodes):
            attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
            try:
                raw_shape_key = str(attrs.get("data-pptx-shape-key") or "").strip()
                shape_key = int(raw_shape_key) if raw_shape_key else node_index
            except (TypeError, ValueError):
                return None
            if (
                shape_key < 0
                or shape_key >= len(flattened_shapes)
                or shape_key in shape_keys
            ):
                return None
            shape_keys.add(shape_key)
            shape_key_order.append(shape_key)
            shape = flattened_shapes[shape_key]
            inspected += 1
            path = str(node.get("path") or "")
            shape_by_path[path] = shape
            shape_key_by_path[path] = shape_key
            parent_shape_path = max(
                (candidate for candidate in shape_paths if path.startswith(candidate + " > ")),
                key=len,
                default=None,
            )
            parent_shape_key = (
                shape_key_by_path.get(parent_shape_path)
                if parent_shape_path is not None
                else None
            )
            if parent_shape_key != old_parent_by_key.get(shape_key):
                # Deletion and same-parent z-order changes are lossless. Moving
                # a source shape across a group boundary is not: its group
                # coordinate space and native OOXML ownership both change.
                return None
            parent_key_by_shape_key[shape_key] = parent_shape_key
            inline_bounds = _canonical_inline_bounds(node)
            if inline_bounds is not None:
                reconciled_bounds = inline_bounds
                if (
                    shape.text is not None
                    and shape.bounds is not None
                    and not _bounds_nearly_equal(shape.bounds, reconciled_bounds)
                ):
                    shape.text.layout_snapshot_dirty = True
                shape.bounds = reconciled_bounds
            elif parent_shape_path is None:
                rect = node.get("rect") if isinstance(node.get("rect"), dict) else {}
                left = (_css_float(rect.get("left"), slide_left) - slide_left) / slide_width_px * presentation.width
                top = (_css_float(rect.get("top"), slide_top) - slide_top) / slide_height_px * presentation.height
                width = _css_float(rect.get("width"), 0.0) / slide_width_px * presentation.width
                height = _css_float(rect.get("height"), 0.0) / slide_height_px * presentation.height
                if width >= 0 and height >= 0:
                    reconciled_bounds = Bounds(left=left, top=top, width=width, height=height)
                    if (
                        shape.text is not None
                        and shape.bounds is not None
                        and not _bounds_nearly_equal(shape.bounds, reconciled_bounds)
                    ):
                        shape.text.layout_snapshot_dirty = True
                    shape.bounds = reconciled_bounds
            else:
                parent_shape = shape_by_path.get(parent_shape_path)
                parent_node = shape_node_by_path.get(parent_shape_path)
                if (
                    parent_shape is not None
                    and parent_shape.group_bounds is not None
                    and parent_node is not None
                ):
                    parent_rect = (
                        parent_node.get("rect")
                        if isinstance(parent_node.get("rect"), dict)
                        else {}
                    )
                    child_rect = (
                        node.get("rect")
                        if isinstance(node.get("rect"), dict)
                        else {}
                    )
                    parent_width = _css_float(parent_rect.get("width"), 0.0)
                    parent_height = _css_float(parent_rect.get("height"), 0.0)
                    if parent_width > 0 and parent_height > 0:
                        group_bounds = parent_shape.group_bounds
                        reconciled_bounds = Bounds(
                            left=group_bounds.left
                            + (
                                _css_float(child_rect.get("left"), 0.0)
                                - _css_float(parent_rect.get("left"), 0.0)
                            )
                            / parent_width
                            * group_bounds.width,
                            top=group_bounds.top
                            + (
                                _css_float(child_rect.get("top"), 0.0)
                                - _css_float(parent_rect.get("top"), 0.0)
                            )
                            / parent_height
                            * group_bounds.height,
                            width=_css_float(child_rect.get("width"), 0.0)
                            / parent_width
                            * group_bounds.width,
                            height=_css_float(child_rect.get("height"), 0.0)
                            / parent_height
                            * group_bounds.height,
                        )
                        if (
                            shape.text is not None
                            and shape.bounds is not None
                            and not _bounds_nearly_equal(
                                shape.bounds,
                                reconciled_bounds,
                            )
                        ):
                            shape.text.layout_snapshot_dirty = True
                        shape.bounds = reconciled_bounds
            if not _reconcile_shape_runs(shape, node, nodes, shape_paths):
                return None
            if not _reconcile_shape_paragraphs(
                shape,
                node,
                nodes,
                shape_paths,
            ):
                return None
            _reconcile_shape_style(
                shape,
                node,
                presentation.width / slide_width_px,
                presentation.height / slide_height_px,
            )
            if not _reconcile_shape_image(shape, node, nodes, shape_paths):
                return None
            if not _reconcile_shape_table(shape, node, nodes, shape_paths):
                return None
        ordered_children: dict[int | None, list[Shape]] = {}
        for shape_key in shape_key_order:
            parent_key = parent_key_by_shape_key.get(shape_key)
            ordered_children.setdefault(parent_key, []).append(
                flattened_shapes[shape_key]
            )
        for shape_key in shape_key_order:
            shape = flattened_shapes[shape_key]
            if shape.shapes is not None:
                shape.shapes = ordered_children.get(shape_key, [])
        slide.shapes = ordered_children.get(None, [])
        retained_shape_ids = {
            shape.shape_id
            for shape in _iter_ir_shapes(slide.shapes)
            if shape.shape_id is not None
        }
        slide.animations = [
            animation
            for animation in slide.animations
            if animation.target_shape_id is None
            or animation.target_shape_id in retained_shape_ids
        ]
    return presentation, inspected

_reconcile_canonical_presentation.__module__ = 'pptx2html.htmlir.compiler'
