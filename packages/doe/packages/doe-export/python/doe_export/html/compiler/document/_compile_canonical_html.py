# Origin: pptx2html/htmlir/compiler.py::_compile_canonical_html
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Background, Bounds, CANONICAL_SLIDE_SELECTOR, Fill, Presentation, SLIDE_HEIGHT, SLIDE_WIDTH, Slide, dataclasses, re
from doe_export.html.compiler.diagnostics.HtmlCompileError import HtmlCompileError
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.snapshot._ast_from_snapshot import _ast_from_snapshot
from doe_export.html.compiler.css._background_fills_from_node import _background_fills_from_node
from doe_export.html.compiler.snapshot._canonical_snapshot_source import _canonical_snapshot_source
from doe_export.html.compiler.document._canonical_source_requires_dom_validation import _canonical_source_requires_dom_validation
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.diagnostics._diagnostics_from_snapshot import _diagnostics_from_snapshot
from doe_export.html.compiler.document._is_canonical_slide_marker import _is_canonical_slide_marker
from doe_export.html.compiler.snapshot._offset_snapshot_node import _offset_snapshot_node
from doe_export.html.compiler.document._reconcile_canonical_presentation import _reconcile_canonical_presentation
from doe_export.html.compiler.browser._refresh_browser_text_layout_from_current_projection import _refresh_browser_text_layout_from_current_projection
from doe_export.html.compiler.browser._run_browser_snapshot import _run_browser_snapshot
from doe_export.html.compiler.structure._semantic_shapes_from_ast import _semantic_shapes_from_ast
from doe_export.html.compiler.document._unchanged_canonical_presentation import _unchanged_canonical_presentation
from doe_export.html.compiler.browser.apply_browser_text_layout_snapshots import apply_browser_text_layout_snapshots

def _compile_canonical_html(
    *,
    source: str,
    slide_index: int,
    include_ast: bool,
    include_browser_screenshot: bool,
    base_url: str | None,
    viewport: tuple[int, int],
    timeout_ms: int,
    max_dom_nodes: int,
    snapshot: dict[str, Any] | None = None,
    force_browser_validation: bool = False,
) -> dict[str, Any]:
    """Compile canonical PPTX HTML, restoring unchanged IR losslessly."""

    embedded = _unchanged_canonical_presentation(source)
    if (
        embedded is not None
        and snapshot is None
        and not include_browser_screenshot
        and not force_browser_validation
        and not _canonical_source_requires_dom_validation(source, embedded)
    ):
        presentation, slide_count = embedded
        migrated_layouts = 0
        try:
            presentation, migrated_layouts = (
                _refresh_browser_text_layout_from_current_projection(
                    presentation,
                    viewport=viewport,
                    timeout_ms=timeout_ms,
                    max_dom_nodes=max(max_dom_nodes, 50_000),
                )
            )
        except Exception:
            # Canonical IR restoration must remain available when Chromium is
            # temporarily unavailable.  The central PPTX export boundary will
            # make the same normalization attempt again before writing OOXML.
            migrated_layouts = 0
        diagnostic = HtmlDiagnostic(
            "info",
            "canonical-html-lossless",
            f"Restored {slide_count} unchanged canonical HTML slides from the lossless IR payload.",
        )
        result_diagnostics = [diagnostic.to_dict()]
        if migrated_layouts:
            result_diagnostics.append(
                HtmlDiagnostic(
                    "info",
                    "canonical-text-layout-migrated",
                    f"Migrated {migrated_layouts} eligible text layout snapshots from a legacy canonical payload.",
                ).to_dict()
            )
        return {
            "success": True,
            "presentation": dataclasses.asdict(presentation),
            "diagnostics": result_diagnostics,
            "ast": {
                "kind": "htmlir-canonical-lossless",
                "slide_count": slide_count,
                "payload_version": 1,
            }
            if include_ast
            else None,
            "browser_screenshot_png_base64": None,
        }

    if snapshot is None:
        slide_marker_count = len(
            re.findall(
                r"data-pptx2html-slide\s*=\s*(['\"])[1-9]\d*\1",
                source,
                re.IGNORECASE,
            )
        )
        snapshot = _run_browser_snapshot(
            source=_canonical_snapshot_source(source),
            base_url=base_url,
            viewport=viewport,
            timeout_ms=max(timeout_ms, min(240_000, 30_000 + slide_marker_count * 5_000)),
            max_dom_nodes=max(max_dom_nodes, 50_000),
            screenshot_selector=CANONICAL_SLIDE_SELECTOR,
        )
    diagnostics = _diagnostics_from_snapshot(snapshot)
    image_data = snapshot.get("screenshot_png_base64")
    if not isinstance(image_data, str) or not image_data:
        raise HtmlCompileError(
            "canonical html browser snapshot did not return a screenshot",
            diagnostics
            + [HtmlDiagnostic("error", "missing-screenshot", "Canonical HTML snapshot returned no screenshot.")],
        )
    ast = _ast_from_snapshot(snapshot)
    if ast.get("truncated"):
        raise HtmlCompileError(
            "canonical html DOM snapshot was truncated",
            diagnostics
            + [HtmlDiagnostic("error", "canonical-dom-truncated", "Canonical HTML exceeded the DOM node limit.")],
        )

    nodes = [node for node in ast.get("nodes") or [] if isinstance(node, dict)]
    slide_nodes = [
        node
        for node in nodes
        if node.get("nodeType") == "element"
        and isinstance(node.get("attributes"), dict)
        and _is_canonical_slide_marker(
            node["attributes"].get("data-pptx2html-slide")
        )
    ]
    if not slide_nodes:
        raise HtmlCompileError(
            "canonical html contains no slide elements",
            diagnostics
            + [
                HtmlDiagnostic(
                    "error",
                    "canonical-slides-missing",
                    "Expected a positive data-pptx2html-slide marker.",
                )
            ],
        )

    embedded_has_full_shape_coverage = embedded is not None and (
        _reconcile_canonical_presentation(source, nodes, slide_nodes, slide_index)
        is not None
    )
    if embedded is not None and not embedded_has_full_shape_coverage:
        diagnostics.insert(
            0,
            HtmlDiagnostic(
                "warning",
                "canonical-payload-coverage-mismatch",
                "Ignored a canonical IR payload that does not cover the visible slide DOM.",
            ),
        )

    if embedded is not None and embedded_has_full_shape_coverage:
        presentation, slide_count = embedded
        patched_layouts = apply_browser_text_layout_snapshots(presentation, nodes)
        migrated_layouts = 0
        try:
            presentation, migrated_layouts = (
                _refresh_browser_text_layout_from_current_projection(
                    presentation,
                    viewport=viewport,
                    timeout_ms=timeout_ms,
                    max_dom_nodes=max(max_dom_nodes, 50_000),
                )
            )
        except Exception:
            migrated_layouts = 0
        patched_layouts += migrated_layouts
        diagnostic = HtmlDiagnostic(
            "info",
            "canonical-html-lossless-snapshot",
            f"Rendered a thumbnail and restored {slide_count} unchanged canonical HTML slides from the exact IR payload.",
        )
        result_diagnostics = [diagnostic.to_dict(), *[item.to_dict() for item in diagnostics]]
        if patched_layouts:
            result_diagnostics.insert(
                1,
                HtmlDiagnostic(
                    "info",
                    "canonical-text-layout-normalized",
                    f"Refreshed {patched_layouts} eligible HTML text layout snapshots.",
                ).to_dict(),
            )
        return {
            "success": True,
            "presentation": dataclasses.asdict(presentation),
            "diagnostics": result_diagnostics,
            "ast": ast if include_ast else None,
            "browser_screenshot_png_base64": image_data if include_browser_screenshot else None,
        }

    reconciled = _reconcile_canonical_presentation(source, nodes, slide_nodes, slide_index)
    if reconciled is not None:
        presentation, changed_shapes = reconciled
        patched_layouts = apply_browser_text_layout_snapshots(presentation, nodes)
        diagnostics.insert(
            0,
            HtmlDiagnostic(
                "info",
                "canonical-ir-reconciled",
                f"Reconciled edited canonical HTML into original IR while preserving untouched shapes ({changed_shapes} shapes inspected).",
            ),
        )
        if patched_layouts:
            diagnostics.insert(
                1,
                HtmlDiagnostic(
                    "info",
                    "canonical-text-layout-normalized",
                    f"Refreshed {patched_layouts} edited HTML text layout snapshots.",
                ),
            )
        return {
            "success": True,
            "presentation": dataclasses.asdict(presentation),
            "diagnostics": [item.to_dict() for item in diagnostics],
            "ast": ast if include_ast else None,
            "browser_screenshot_png_base64": image_data if include_browser_screenshot else None,
        }

    slides: list[Slide] = []
    presentation_width = SLIDE_WIDTH
    presentation_height = SLIDE_HEIGHT
    for order, slide_node in enumerate(slide_nodes):
        slide_path = str(slide_node.get("path") or "")
        slide_rect = slide_node.get("rect") if isinstance(slide_node.get("rect"), dict) else {}
        slide_left = _css_float(slide_rect.get("left"), 0.0)
        slide_top = _css_float(slide_rect.get("top"), 0.0)
        slide_width_px = max(1.0, _css_float(slide_rect.get("width"), float(viewport[0])))
        slide_height_px = max(1.0, _css_float(slide_rect.get("height"), float(viewport[1])))
        attrs = slide_node.get("attributes") if isinstance(slide_node.get("attributes"), dict) else {}
        slide_width = max(1.0, _css_float(attrs.get("data-width"), SLIDE_WIDTH))
        slide_height = max(1.0, _css_float(attrs.get("data-height"), SLIDE_HEIGHT))
        descendants = []
        for node in nodes:
            path = str(node.get("path") or "")
            if not path.startswith(slide_path + " > "):
                continue
            node_attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
            if str(node_attrs.get("data-pptx2html-ignore") or "").lower() == "true":
                continue
            descendants.append(_offset_snapshot_node(node, slide_left, slide_top))
        slide_diagnostics: list[HtmlDiagnostic] = []
        shapes = _semantic_shapes_from_ast(
            {
                "kind": "htmlir-canonical-slide",
                "viewport": {"width": slide_width_px, "height": slide_height_px},
                "nodes": descendants,
                "truncated": False,
            },
            (max(1, round(slide_width_px)), max(1, round(slide_height_px))),
            slide_diagnostics,
            (slide_width, slide_height),
        )
        diagnostics.extend(slide_diagnostics)
        background_fills = _background_fills_from_node(
            slide_node,
            Bounds(left=0.0, top=0.0, width=slide_width, height=slide_height),
        )
        slides.append(
            Slide(
                index=slide_index + order,
                name=str(attrs.get("data-slide-name") or f"html slide {slide_index + order + 1}"),
                show=True,
                background=Background(
                    fill=background_fills[-1] if background_fills else Fill(type="solid", color="FFFFFF")
                ),
                shapes=shapes,
            )
        )
        if order == 0:
            presentation_width = slide_width
            presentation_height = slide_height

    presentation = Presentation(width=presentation_width, height=presentation_height, slides=slides)
    diagnostics.insert(
        0,
        HtmlDiagnostic("info", "canonical-html-deck", f"Compiled {len(slides)} canonical HTML slides into editable IR."),
    )
    return {
        "success": True,
        "presentation": dataclasses.asdict(presentation),
        "diagnostics": [item.to_dict() for item in diagnostics],
        "ast": ast if include_ast else None,
        "browser_screenshot_png_base64": image_data if include_browser_screenshot else None,
    }

_compile_canonical_html.__module__ = 'pptx2html.htmlir.compiler'
