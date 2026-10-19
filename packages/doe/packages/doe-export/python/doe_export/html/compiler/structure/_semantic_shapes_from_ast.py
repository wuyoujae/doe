# Origin: pptx2html/htmlir/compiler.py::_semantic_shapes_from_ast
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Border, Bounds, DEFAULT_VIEWPORT, Fill, SKIP_TAGS, SLIDE_HEIGHT, SLIDE_WIDTH, SVG_GRAPHIC_CHILD_TAGS, SVG_NAMESPACE, Shape, VOID_TEXT_TAGS
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.structure._active_float_boxes_for_node import _active_float_boxes_for_node
from doe_export.html.compiler.geometry._adjust_list_item_bounds import _adjust_list_item_bounds
from doe_export.html.compiler.css._append_shadow_diagnostics import _append_shadow_diagnostics
from doe_export.html.compiler.document._apply_object_fit_crop import _apply_object_fit_crop
from doe_export.html.compiler.diagnostics._background_diagnostics_from_node import _background_diagnostics_from_node
from doe_export.html.compiler.css._background_fills_from_node import _background_fills_from_node
from doe_export.html.compiler.css._border_shapes_from_node import _border_shapes_from_node
from doe_export.html.compiler.geometry._bounds_from_node import _bounds_from_node
from doe_export.html.compiler.geometry._bounds_nearly_equal import _bounds_nearly_equal
from doe_export.html.compiler.css._box_shadow_from_node import _box_shadow_from_node
from doe_export.html.compiler.geometry._clip_mask_diagnostics import _clip_mask_diagnostics
from doe_export.html.compiler.geometry._clip_mask_for_node import _clip_mask_for_node
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.geometry._css_transform_rotation import _css_transform_rotation
from doe_export.html.compiler.structure._filter_effects_from_node import _filter_effects_from_node
from doe_export.html.compiler.css._filter_shadow_from_node import _filter_shadow_from_node
from doe_export.html.compiler.document._first_soft_edge_effect import _first_soft_edge_effect
from doe_export.html.compiler.typography._flex_baseline_top_offset import _flex_baseline_top_offset
from doe_export.html.compiler.structure._float_box_from_node import _float_box_from_node
from doe_export.html.compiler.assets._image_info_from_node import _image_info_from_node
from doe_export.html.compiler.assets._image_info_from_src import _image_info_from_src
from doe_export.html.compiler.assets._is_remote_image_placeholder import _is_remote_image_placeholder
from doe_export.html.compiler.diagnostics._layout_diagnostics_from_node import _layout_diagnostics_from_node
from doe_export.html.compiler.typography._native_outline_border_from_node import _native_outline_border_from_node
from doe_export.html.compiler.structure._native_table_fallback_reason import _native_table_fallback_reason
from doe_export.html.compiler.geometry._object_fit_contain_bounds import _object_fit_contain_bounds
from doe_export.html.compiler.typography._outline_shape_from_node import _outline_shape_from_node
from doe_export.html.compiler.document._path_is_under_any import _path_is_under_any
from doe_export.html.compiler.css._rounded_border_shapes_from_node import _rounded_border_shapes_from_node
from doe_export.html.compiler.geometry._rounded_overflow_clip_masks import _rounded_overflow_clip_masks
from doe_export.html.compiler.css._shadow_diagnostics import _shadow_diagnostics
from doe_export.html.compiler.css._shadow_host_diagnostics import _shadow_host_diagnostics
from doe_export.html.compiler.geometry._shape_geometry_for_node import _shape_geometry_for_node
from doe_export.html.compiler.structure._shape_name import _shape_name
from doe_export.html.compiler.svg._svg_graphic_shapes_from_node import _svg_graphic_shapes_from_node
from doe_export.html.compiler.svg._svg_text_shape import _svg_text_shape
from doe_export.html.compiler.structure._table_shape_from_node import _table_shape_from_node
from doe_export.html.compiler.typography._text_decoration_shapes_from_node import _text_decoration_shapes_from_node
from doe_export.html.compiler.typography._text_for_node import _text_for_node
from doe_export.html.compiler.typography._text_frame_from_node import _text_frame_from_node
from doe_export.html.compiler.typography._text_shape_bounds_from_node import _text_shape_bounds_from_node
from doe_export.html.compiler.geometry._transform_adjusted_bounds import _transform_adjusted_bounds
from doe_export.html.compiler.diagnostics._unique_diagnostics import _unique_diagnostics
from doe_export.html.compiler.typography._uses_background_clip_text import _uses_background_clip_text

def _semantic_shapes_from_ast(
    ast: dict[str, Any],
    viewport: tuple[int, int],
    diagnostics: list[HtmlDiagnostic],
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> list[Shape]:
    nodes = [node for node in ast.get("nodes") or [] if isinstance(node, dict)]
    nodes_by_path = {str(node.get("path") or ""): node for node in nodes if node.get("nodeType") == "element"}
    element_paths = {
        str(node.get("path") or "")
        for node in nodes
        if node.get("nodeType") == "element"
    }
    table_consumed_prefixes: set[str] = set()
    visual_shapes: list[Shape] = []
    text_shapes: list[Shape] = []
    next_shape_id = 1
    canvas_width, canvas_height = canvas_size
    sx = canvas_width / float(viewport[0] or DEFAULT_VIEWPORT[0])
    sy = canvas_height / float(viewport[1] or DEFAULT_VIEWPORT[1])
    active_float_boxes: list[_HtmlFloatBox] = []
    clip_masks = _rounded_overflow_clip_masks(nodes, sx, sy, canvas_size)

    for node in nodes:
        path = str(node.get("path") or "")
        if path and _path_is_under_any(path, table_consumed_prefixes):
            continue
        if node.get("nodeType") != "element" or not node.get("visible"):
            continue
        tag = str(node.get("tag") or "").lower()
        if node.get("namespaceURI") == SVG_NAMESPACE and tag in {"text", "tspan"}:
            svg_text_shape = _svg_text_shape(node, sx, sy, next_shape_id)
            if svg_text_shape is not None:
                text_shapes.append(svg_text_shape)
                next_shape_id += 1
            continue
        if tag in SKIP_TAGS:
            continue
        if tag in SVG_GRAPHIC_CHILD_TAGS:
            continue
        bounds = _bounds_from_node(node, sx, sy, canvas_size)
        if not bounds or bounds.width < 0.25 or bounds.height < 0.25:
            continue
        media = node.get("media") or {}
        if tag == "img" and media.get("paintedSrc") and media.get("paintedRect"):
            rect = media["paintedRect"]
            visual_shapes.append(Shape(
                type="picture", name=_shape_name(node, "image"), shape_id=next_shape_id,
                bounds=Bounds(rect["left"] * sx, rect["top"] * sy, rect["width"] * sx, rect["height"] * sy),
                image=_image_info_from_src(media["paintedSrc"]),
                diagnostics=["htmlir:image", "htmlir:image-css-alpha-mask"],
            ))
            next_shape_id += 1
            continue
        bounds = _adjust_list_item_bounds(node, bounds)

        computed = _computed(node)
        rotation = _css_transform_rotation(computed)
        if rotation is not None:
            bounds = _transform_adjusted_bounds(node, bounds, rotation, sx, sy)
        active_float_boxes = _active_float_boxes_for_node(active_float_boxes, path, bounds, computed)
        layout_diagnostics = _layout_diagnostics_from_node(node, nodes_by_path)
        display = str(computed.get("display") or "").strip().lower()
        float_box = _float_box_from_node(node, path, bounds)

        if tag == "table":
            fallback_reason = _native_table_fallback_reason(node, nodes, path, table_paths=[
                str(candidate.get("path") or "")
                for candidate in nodes
                if str(candidate.get("tag") or "").lower() == "table"
            ])
            if fallback_reason is None:
                table_shape, next_shape_id = _table_shape_from_node(
                    node,
                    nodes,
                    nodes_by_path,
                    sx,
                    sy,
                    next_shape_id,
                    diagnostics,
                    canvas_size,
                )
                if table_shape is not None:
                    table_shape.diagnostics = _unique_diagnostics(
                        list(table_shape.diagnostics) + layout_diagnostics
                    )
                    visual_shapes.append(table_shape)
                if path:
                    table_consumed_prefixes.add(path)
                if float_box is not None:
                    active_float_boxes.append(float_box)
                continue
            diagnostics.append(
                HtmlDiagnostic(
                    "info",
                    "htmlir-table-layout-fallback",
                    (
                        "HTML <table> contains complex layout content, so htmlir keeps its DOM descendants "
                        f"as editable shapes instead of flattening the subtree into native TableInfo ({fallback_reason})."
                    ),
                    tag="table",
                )
            )

        filter_effects = _filter_effects_from_node(node, sx, sy)
        clip_mask = _clip_mask_for_node(path, bounds, clip_masks)
        clip_mask_adjusted_bounds = False
        if clip_mask is not None and not _bounds_nearly_equal(bounds, clip_mask.bounds):
            bounds = clip_mask.bounds
            clip_mask_adjusted_bounds = True
        geometry, geometry_source, geometry_paths = _shape_geometry_for_node(node, bounds, clip_mask)
        native_border = _native_outline_border_from_node(node, sx, sy) if geometry != "rect" or rotation is not None else None
        rounded_border_shapes = _rounded_border_shapes_from_node(node, bounds, next_shape_id, sx, sy)
        if rounded_border_shapes:
            # CSS borders occupy the inside of the border box; an Office outline
            # straddles it and cannot represent different widths at each corner.
            native_border = None
        background_fills = _background_fills_from_node(node, bounds)
        background_fill = background_fills[-1] if background_fills else None
        shadow = (
            _box_shadow_from_node(node, sx, sy)
            or _filter_shadow_from_node(node, sx, sy)
            or _first_soft_edge_effect(filter_effects)
        )
        shadow_consumed = False
        if background_fills:
            base_diagnostics = (
                ["htmlir:background"]
                + _background_diagnostics_from_node(node, background_fill)
                + layout_diagnostics
            )
            if len(background_fills) > 1:
                base_diagnostics.append("htmlir:background-multiple-layers")
            if geometry != "rect":
                base_diagnostics.append("htmlir:border-radius")
            if geometry_source == "custom":
                base_diagnostics.append("htmlir:border-radius-asymmetric")
            if clip_mask is not None:
                base_diagnostics.append("htmlir:overflow-clip-inherited")
                if clip_mask.edge != "border-box":
                    base_diagnostics.append(f"htmlir:overflow-clip-{clip_mask.edge}")
            if clip_mask_adjusted_bounds:
                base_diagnostics.append("htmlir:overflow-clip-bounds")
            if native_border is not None:
                base_diagnostics.append("htmlir:border-outline")
            _append_shadow_diagnostics(base_diagnostics, shadow)
            for layer_index, layer_fill in enumerate(background_fills):
                is_bottom_layer = layer_index == 0
                is_top_layer = layer_index == len(background_fills) - 1
                shape_diagnostics = list(base_diagnostics)
                if len(background_fills) > 1:
                    shape_diagnostics.append(f"htmlir:background-layer-{layer_index + 1}-of-{len(background_fills)}")
                layer_shadow = shadow if is_bottom_layer else None
                visual_shapes.append(
                    Shape(
                        type="auto_shape",
                        name=_shape_name(node, "background"),
                        shape_id=next_shape_id,
                        bounds=bounds,
                        rotation=rotation,
                        geometry=geometry,
                        geometry_source=geometry_source,
                        geometry_paths=list(geometry_paths),
                        fill=layer_fill,
                        border=native_border if is_top_layer and native_border is not None else Border(no_fill=True),
                        shadow=layer_shadow,
                        effects=filter_effects,
                        diagnostics=shape_diagnostics,
                    )
                )
                next_shape_id += 1
            shadow_consumed = shadow is not None

        border_is_rendered_by_visual_shape = bool(background_fills) and native_border is not None
        border_is_rendered_by_image_shape = tag == "img" and native_border is not None
        if native_border is not None and background_fill is None and tag != "img":
            shape_diagnostics = ["htmlir:border-outline", "htmlir:border-radius"] + layout_diagnostics
            if geometry_source == "custom":
                shape_diagnostics.append("htmlir:border-radius-asymmetric")
            if clip_mask is not None:
                shape_diagnostics.append("htmlir:overflow-clip-inherited")
                if clip_mask.edge != "border-box":
                    shape_diagnostics.append(f"htmlir:overflow-clip-{clip_mask.edge}")
            if clip_mask_adjusted_bounds:
                shape_diagnostics.append("htmlir:overflow-clip-bounds")
            shape_shadow = shadow if not shadow_consumed else None
            _append_shadow_diagnostics(shape_diagnostics, shape_shadow)
            visual_shapes.append(
                Shape(
                    type="auto_shape",
                    name=_shape_name(node, "border"),
                    shape_id=next_shape_id,
                    bounds=bounds,
                    rotation=rotation,
                    geometry=geometry,
                    geometry_source=geometry_source,
                    geometry_paths=list(geometry_paths),
                    fill=Fill(type="none"),
                    border=native_border,
                    shadow=shape_shadow,
                    effects=filter_effects,
                    diagnostics=shape_diagnostics,
                )
            )
            next_shape_id += 1
            border_is_rendered_by_visual_shape = True
            shadow_consumed = shadow_consumed or shape_shadow is not None

        if (
            shadow is not None
            and not shadow_consumed
            and tag not in {"body", "img"}
            and background_fill is None
            and native_border is None
        ):
            visual_shapes.append(
                Shape(
                    type="auto_shape",
                    name=_shape_name(node, "box-shadow"),
                    shape_id=next_shape_id,
                    bounds=bounds,
                    rotation=rotation,
                    geometry=geometry,
                    geometry_source=geometry_source,
                    geometry_paths=list(geometry_paths),
                    # PPTX does not reliably draw a shadow for a fully no-fill
                    # borderless shape, so use a nearly transparent host.
                    fill=Fill(type="solid", color="FFFFFF", alpha=0.001),
                    border=Border(no_fill=True),
                    shadow=shadow,
                    effects=filter_effects,
                    diagnostics=_shadow_host_diagnostics(shadow, layout_diagnostics),
                )
            )
            next_shape_id += 1
            shadow_consumed = True

        if not border_is_rendered_by_visual_shape and not border_is_rendered_by_image_shape:
            border_shapes = rounded_border_shapes or _border_shapes_from_node(node, bounds, next_shape_id, sx, sy)
            for index, shape in enumerate(border_shapes):
                shape.shape_id = next_shape_id + index
                shape.rotation = rotation
            visual_shapes.extend(border_shapes)
            next_shape_id += len(border_shapes)

        outline_shape = _outline_shape_from_node(
            node,
            bounds,
            geometry,
            next_shape_id,
            sx,
            sy,
            canvas_size,
        )
        if outline_shape is not None:
            visual_shapes.append(outline_shape)
            next_shape_id += 1

        if tag == "body":
            if float_box is not None:
                active_float_boxes.append(float_box)
            continue

        if tag == "svg":
            svg_shapes, next_shape_id = _svg_graphic_shapes_from_node(
                node,
                nodes,
                path,
                bounds,
                next_shape_id,
            )
            visual_shapes.extend(svg_shapes)
            if float_box is not None:
                active_float_boxes.append(float_box)
            continue

        if tag == "img":
            image = _image_info_from_node(node)
            if image is not None:
                bounds = _object_fit_contain_bounds(node, bounds)
                _apply_object_fit_crop(image, node, bounds)
                image_diagnostics = ["htmlir:image"] + layout_diagnostics
                if _is_remote_image_placeholder(node):
                    image_diagnostics.append("yrkie:remote-image-placeholder")
                if geometry != "rect":
                    image_diagnostics.append("htmlir:border-radius")
                    if geometry_source == "custom":
                        image_diagnostics.append("htmlir:border-radius-asymmetric")
                    if clip_mask is not None:
                        image_diagnostics.append("htmlir:overflow-clip-inherited")
                        if clip_mask.edge != "border-box":
                            image_diagnostics.append(f"htmlir:overflow-clip-{clip_mask.edge}")
                    if clip_mask_adjusted_bounds:
                        image_diagnostics.append("htmlir:overflow-clip-bounds")
                    image_diagnostics.extend(_shadow_diagnostics(shadow))
                    visual_shapes.append(
                        Shape(
                            type="auto_shape",
                            name=_shape_name(node, "image"),
                            shape_id=next_shape_id,
                            bounds=bounds,
                            rotation=rotation,
                            geometry=geometry,
                            geometry_source=geometry_source,
                            geometry_paths=list(geometry_paths),
                            fill=Fill(type="picture", image=image),
                            border=native_border or Border(no_fill=True),
                            shadow=shadow,
                            effects=filter_effects,
                            diagnostics=image_diagnostics,
                        )
                    )
                    next_shape_id += 1
                    shadow_consumed = shadow_consumed or shadow is not None
                    if float_box is not None:
                        active_float_boxes.append(float_box)
                    continue
                visual_shapes.append(
                    Shape(
                        type="picture",
                        name=_shape_name(node, "image"),
                        shape_id=next_shape_id,
                        bounds=bounds,
                        rotation=rotation,
                        geometry=geometry,
                        geometry_source=geometry_source,
                        geometry_paths=list(geometry_paths),
                        image=image,
                        border=Border(no_fill=True),
                        shadow=shadow,
                        effects=filter_effects,
                        diagnostics=image_diagnostics
                        + _clip_mask_diagnostics(clip_mask, adjusted_bounds=clip_mask_adjusted_bounds)
                        + _shadow_diagnostics(shadow),
                    )
                )
                next_shape_id += 1
                shadow_consumed = shadow_consumed or shadow is not None
            if float_box is not None:
                active_float_boxes.append(float_box)
            continue

        text = _text_for_node(node, element_paths, nodes_by_path)
        if text and tag not in VOID_TEXT_TAGS:
            text_bounds = _text_shape_bounds_from_node(
                node,
                bounds,
                nodes_by_path,
                active_float_boxes,
                sx,
                sy,
                canvas_size,
            )
            text_diagnostics = ["htmlir:text"] + layout_diagnostics
            if _uses_background_clip_text(computed):
                text_diagnostics.append("htmlir:background-clip-text-solid-fallback")
            text_shapes.append(
                Shape(
                    type="auto_shape",
                    name=_shape_name(node, "text"),
                    shape_id=next_shape_id,
                    bounds=text_bounds,
                    rotation=rotation,
                    geometry="rect",
                    geometry_source="preset",
                    fill=Fill(type="none"),
                    border=Border(no_fill=True),
                    text=_text_frame_from_node(
                        text,
                        node,
                        sx,
                        sy,
                        container_bounds=text_bounds,
                        baseline_top_offset=_flex_baseline_top_offset(
                            node,
                            nodes_by_path,
                            sy,
                        ),
                    ),
                    diagnostics=text_diagnostics,
                )
            )
            next_shape_id += 1
            decoration_shapes = _text_decoration_shapes_from_node(node, bounds, next_shape_id, sx, sy)
            text_shapes.extend(decoration_shapes)
            next_shape_id += len(decoration_shapes)

        if float_box is not None:
            active_float_boxes.append(float_box)

    shapes = visual_shapes + text_shapes
    if shapes:
        diagnostics.append(
            HtmlDiagnostic(
                "info",
                "semantic-shape-count",
                f"Mapped {len(shapes)} editable shapes from browser DOM boxes.",
            )
        )
    return shapes

_semantic_shapes_from_ast.__module__ = 'pptx2html.htmlir.compiler'
