# Origin: pptx2html/htmlir/compiler.py::_refresh_browser_text_layout_from_current_projection
from __future__ import annotations
from doe_export.html.compiler.shared import Presentation
from doe_export.html.compiler.typography._presentation_text_layout_entries import _presentation_text_layout_entries
from doe_export.html.compiler.browser._text_frame_needs_browser_layout import _text_frame_needs_browser_layout
from doe_export.html.compiler.typography.normalize_canonical_text_layout import normalize_canonical_text_layout

def _refresh_browser_text_layout_from_current_projection(
    presentation: Presentation,
    *,
    viewport: tuple[int, int],
    timeout_ms: int,
    max_dom_nodes: int,
) -> tuple[Presentation, int]:
    """Migrate legacy canonical IR through today's keyed HTML projection."""

    if not any(
        _text_frame_needs_browser_layout(text_frame, metrics)
        for _key, text_frame, metrics in _presentation_text_layout_entries(
            presentation
        )
    ):
        return presentation, 0
    # Import locally so the compiler remains independent while the module is
    # initialising.  The renderer itself does not import this compiler.
    from pptx2html.renderer import CanonicalHtmlRenderer

    current_source = CanonicalHtmlRenderer(mode="embedded").render(presentation)
    return normalize_canonical_text_layout(
        current_source,
        presentation,
        viewport=viewport,
        timeout_ms=timeout_ms,
        max_dom_nodes=max_dom_nodes,
    )

_refresh_browser_text_layout_from_current_projection.__module__ = 'pptx2html.htmlir.compiler'
