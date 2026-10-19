# Origin: pptx2html/htmlir/reconcile.py::_EditableHtmlAssetGuard
from __future__ import annotations
from doe_export.html.reconcile.shared import HTMLParser, _INLINE_DATA_SCHEME_PATTERN

class _EditableHtmlAssetGuard(HTMLParser):
    """Detect active payloads and inline binary URLs before Canonical wrapping."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.has_script = False
        self.has_inline_data_url = False
        self._style_depth = 0

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        normalized_tag = tag.lower()
        if normalized_tag == "script":
            self.has_script = True
        if normalized_tag == "style":
            self._style_depth += 1
        for _name, value in attrs:
            if isinstance(value, str) and _INLINE_DATA_SCHEME_PATTERN.search(value):
                self.has_inline_data_url = True

    def handle_startendtag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        self.handle_starttag(tag, attrs)
        if tag.lower() == "style":
            self._style_depth = max(0, self._style_depth - 1)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "style":
            self._style_depth = max(0, self._style_depth - 1)

    def handle_data(self, data: str) -> None:
        if self._style_depth and _INLINE_DATA_SCHEME_PATTERN.search(data):
            self.has_inline_data_url = True

_EditableHtmlAssetGuard.__module__ = 'pptx2html.htmlir.reconcile'
