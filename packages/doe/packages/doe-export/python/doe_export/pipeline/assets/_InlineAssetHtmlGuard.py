# Origin: pptx_pipeline.py::_InlineAssetHtmlGuard
from __future__ import annotations
from doe_export.pipeline.shared import HTMLParser, _ANY_DATA_URL_PATTERN

class _InlineAssetHtmlGuard(HTMLParser):
    """Inspect actual HTML/CSS resource slots without scanning visible text."""

    _RESOURCE_ATTRIBUTES = {
        "src",
        "srcset",
        "href",
        "xlink:href",
        "poster",
        "data",
        "background",
        "style",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.has_inline_asset = False
        self._style_depth = 0

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        if tag.lower() == "style":
            self._style_depth += 1
        for name, value in attrs:
            if (
                name.lower() in self._RESOURCE_ATTRIBUTES
                and isinstance(value, str)
                and _ANY_DATA_URL_PATTERN.search(value)
            ):
                self.has_inline_asset = True

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
        if self._style_depth and _ANY_DATA_URL_PATTERN.search(data):
            self.has_inline_asset = True

_InlineAssetHtmlGuard.__module__ = 'pptx_pipeline'
