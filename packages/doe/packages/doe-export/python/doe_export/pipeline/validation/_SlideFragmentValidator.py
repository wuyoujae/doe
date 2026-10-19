# Origin: pptx_pipeline.py::_SlideFragmentValidator
from __future__ import annotations
from doe_export.pipeline.shared import FORBIDDEN_SLIDE_TAGS, HTMLParser, VOID_SLIDE_TAGS

class _SlideFragmentValidator(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.depth = 0
        self.stack: list[str] = []
        self.root_count = 0
        self.root_tag: str | None = None
        self.errors: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        normalized = tag.lower()
        if normalized in FORBIDDEN_SLIDE_TAGS:
            self.errors.append(f"Forbidden slide fragment tag: {normalized}.")
        if any(name.lower().startswith("on") for name, _value in attrs):
            self.errors.append(f"Event attributes are not allowed on <{normalized}>.")
        if self.depth == 0:
            self.root_count += 1
            self.root_tag = normalized
        if normalized not in VOID_SLIDE_TAGS:
            self.stack.append(normalized)
            self.depth = len(self.stack)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        normalized = tag.lower()
        if normalized in FORBIDDEN_SLIDE_TAGS:
            self.errors.append(f"Forbidden slide fragment tag: {normalized}.")
        if any(name.lower().startswith("on") for name, _value in attrs):
            self.errors.append(f"Event attributes are not allowed on <{normalized}>.")
        if self.depth == 0:
            self.root_count += 1
            self.root_tag = normalized

    def handle_endtag(self, tag: str) -> None:
        normalized = tag.lower()
        if not self.stack:
            self.errors.append(f"Unexpected closing tag: </{normalized}>.")
            return
        expected = self.stack[-1]
        if expected != normalized:
            self.errors.append(f"Mismatched closing tag: expected </{expected}> but found </{normalized}>.")
            return
        self.stack.pop()
        self.depth = len(self.stack)

    def handle_data(self, data: str) -> None:
        if self.depth == 0 and data.strip():
            self.errors.append("Slide fragment cannot contain text outside its root container.")

_SlideFragmentValidator.__module__ = 'pptx_pipeline'
