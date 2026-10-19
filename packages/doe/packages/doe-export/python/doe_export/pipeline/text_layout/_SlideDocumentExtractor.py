# Origin: pptx_pipeline.py::_SlideDocumentExtractor
from __future__ import annotations
from doe_export.pipeline.shared import HTMLParser, _DOCUMENT_PADDING_PATTERN, re

class _SlideDocumentExtractor(HTMLParser):
    """Locate a single explicit HTML document without reparsing its body."""

    def __init__(self, source: str) -> None:
        super().__init__(convert_charrefs=False)
        self.source = source
        self.line_offsets = [0]
        self.line_offsets.extend(match.end() for match in re.finditer(r"\n", source))
        self.doctype_count = 0
        self.html_count = 0
        self.body_count = 0
        self.html_start: int | None = None
        self.html_end: int | None = None
        self.body_content_start: int | None = None
        self.body_content_end: int | None = None

    def _offset(self) -> int:
        line, column = self.getpos()
        return self.line_offsets[line - 1] + column

    def _tag_end(self, offset: int) -> int | None:
        end = self.source.find(">", offset)
        return end + 1 if end >= 0 else None

    def handle_decl(self, decl: str) -> None:
        if decl.lstrip().lower().startswith("doctype"):
            self.doctype_count += 1

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        del attrs
        normalized = tag.lower()
        offset = self._offset()
        if normalized == "html":
            self.html_count += 1
            if self.html_start is None:
                self.html_start = offset
        elif normalized == "body":
            self.body_count += 1
            if self.body_content_start is None:
                start_tag = self.get_starttag_text()
                self.body_content_start = offset + len(start_tag)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        normalized = tag.lower()
        end = self._tag_end(self._offset())
        if normalized == "body" and self.body_content_end is None:
            self.body_content_end = end
        elif normalized == "html" and self.html_end is None:
            self.html_end = end

    def handle_endtag(self, tag: str) -> None:
        normalized = tag.lower()
        offset = self._offset()
        if normalized == "body" and self.body_content_end is None:
            self.body_content_end = offset
        elif normalized == "html" and self.html_end is None:
            self.html_end = self._tag_end(offset)

    @property
    def is_document(self) -> bool:
        return bool(self.doctype_count or self.html_count or self.body_count)

    def extract_body(self) -> str:
        if self.html_count > 1 or self.body_count > 1:
            raise ValueError(
                "Slide content contains multiple HTML documents. "
                "Submit each document as a separate slide item."
            )
        if self.doctype_count > 1 or self.html_count != 1 or self.body_count != 1:
            raise ValueError(
                "A complete slide document must contain exactly one <html> element "
                "and one <body> element."
            )
        positions = (
            self.html_start,
            self.body_content_start,
            self.body_content_end,
            self.html_end,
        )
        if any(position is None for position in positions):
            raise ValueError("The slide HTML document has unbalanced wrapper tags.")
        html_start, body_start, body_end, html_end = positions
        assert html_start is not None
        assert body_start is not None
        assert body_end is not None
        assert html_end is not None
        if not (html_start < body_start <= body_end < html_end):
            raise ValueError("The slide <body> must be contained by its <html> element.")
        if not _DOCUMENT_PADDING_PATTERN.fullmatch(self.source[:html_start]):
            raise ValueError("Slide content cannot appear outside its <html> element.")
        if not _DOCUMENT_PADDING_PATTERN.fullmatch(self.source[html_end:]):
            raise ValueError("Slide content cannot appear outside its <html> element.")
        return self.source[body_start:body_end].strip()

_SlideDocumentExtractor.__module__ = 'pptx_pipeline'
