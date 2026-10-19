"""HTML Renderer for pptx2html.

Converts an IR ``Presentation`` into a self‑contained HTML document
with a built‑in slide viewer (navigation, scale‑to‑fit).
"""

from .canonical_html_renderer import CanonicalHtmlRenderer
from .html_renderer import HtmlRenderer

__all__ = ["CanonicalHtmlRenderer", "HtmlRenderer"]
