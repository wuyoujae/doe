# Origin: pptx2html/htmlir/compiler.py::_compile_browser_snapshot
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Background, Border, Bounds, Fill, ImageInfo, Presentation, Shape, Slide, dataclasses
from doe_export.html.compiler.diagnostics.HtmlCompileError import HtmlCompileError
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.snapshot._ast_from_snapshot import _ast_from_snapshot
from doe_export.html.compiler.diagnostics._diagnostics_from_snapshot import _diagnostics_from_snapshot
from doe_export.html.compiler.document._presentation_size_for_viewport import _presentation_size_for_viewport
from doe_export.html.compiler.structure._require_editable_element_coverage import _require_editable_element_coverage
from doe_export.html.compiler.structure._semantic_shapes_from_ast import _semantic_shapes_from_ast

def _compile_browser_snapshot(
    snapshot: dict[str, Any],
    *,
    slide_index: int,
    include_ast: bool,
    include_browser_screenshot: bool,
    viewport: tuple[int, int],
    render_mode: str,
    require_editable_coverage: bool = False,
) -> dict[str, Any]:
    presentation_size = _presentation_size_for_viewport(viewport)
    presentation_width, presentation_height = presentation_size
    diagnostics = _diagnostics_from_snapshot(snapshot)
    image_data = snapshot.get("screenshot_png_base64")
    if not isinstance(image_data, str) or not image_data:
        raise HtmlCompileError(
            "html browser snapshot did not return a screenshot",
            diagnostics
            + [
                HtmlDiagnostic(
                    "error",
                    "missing-screenshot",
                    "The browser snapshot completed without screenshot data.",
                )
            ],
        )

    ast = _ast_from_snapshot(snapshot)
    if render_mode == "semantic" and require_editable_coverage:
        _require_editable_element_coverage(ast)
    node_count = len(ast.get("nodes") or [])
    shapes = (
        _semantic_shapes_from_ast(ast, viewport, diagnostics, presentation_size)
        if render_mode == "semantic"
        else []
    )
    if render_mode == "semantic" and not shapes:
        diagnostics.append(
            HtmlDiagnostic(
                "warning",
                "semantic-empty-fallback",
                "No editable HTML nodes were mapped; falling back to one full-slide snapshot picture.",
            )
        )
        render_mode = "snapshot"

    if render_mode == "snapshot":
        shapes = [
            Shape(
                type="picture",
                name="html browser snapshot",
                shape_id=1,
                bounds=Bounds(0.0, 0.0, presentation_width, presentation_height),
                geometry="rect",
                geometry_source="preset",
                image=ImageInfo(
                    content_type="image/png",
                    data=image_data,
                    intrinsic_width_pt=presentation_width,
                    intrinsic_height_pt=presentation_height,
                ),
                border=Border(no_fill=True),
                diagnostics=[
                    "htmlir:snapshot-render",
                    "htmlir:editable=false",
                    f"htmlir:dom-nodes={node_count}",
                    f"htmlir:viewport={viewport[0]}x{viewport[1]}",
                ],
            )
        ]

    slide = Slide(
        index=slide_index,
        name=f"html slide {slide_index + 1}",
        show=True,
        background=Background(fill=Fill(type="solid", color="FFFFFF")),
        shapes=shapes,
    )
    presentation = Presentation(width=presentation_width, height=presentation_height, slides=[slide])

    diagnostics.insert(
        0,
        HtmlDiagnostic(
            "info",
            "semantic-editable-ir" if render_mode == "semantic" else "snapshot-picture-ir",
            (
                f"Rendered HTML/CSS through Chromium and mapped {len(shapes)} DOM-derived editable IR shapes."
                if render_mode == "semantic"
                else "Rendered HTML/CSS through Chromium and emitted the visual result as a full-slide picture IR shape; DOM and computed styles are available in ast for semantic promotion."
            ),
        ),
    )

    return {
        "success": True,
        "presentation": dataclasses.asdict(presentation),
        "diagnostics": [item.to_dict() for item in diagnostics],
        "ast": ast if include_ast else None,
        "browser_screenshot_png_base64": image_data if include_browser_screenshot else None,
    }

_compile_browser_snapshot.__module__ = 'pptx2html.htmlir.compiler'
