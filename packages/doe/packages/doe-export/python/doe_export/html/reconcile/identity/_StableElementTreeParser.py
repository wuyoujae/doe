# Origin: pptx2html/htmlir/reconcile.py::_StableElementTreeParser
from __future__ import annotations
from doe_export.html.reconcile.shared import HTMLParser

class _StableElementTreeParser(HTMLParser):
    """Capture stable editable subtrees without interpreting their contents."""

    _VOID_TAGS = {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.records: dict[str, dict[str, Any]] = {}
        self.duplicates: set[str] = set()
        self._stack: list[tuple[str, str | None]] = []
        self._active_ids: list[str] = []
        self._order = 0

    @staticmethod
    def _start_token(
        tag: str,
        attrs: list[tuple[str, str | None]],
        *,
        closed: bool,
    ) -> str:
        normalized = " ".join(
            f"{name.lower()}={value!r}"
            for name, value in sorted(attrs, key=lambda item: item[0].lower())
        )
        suffix = "/>" if closed else ">"
        return f"<{tag.lower()} {normalized}{suffix}"

    def _append(self, token: str) -> None:
        for element_id in self._active_ids:
            record = self.records.get(element_id)
            if record is not None:
                record["tokens"].append(token)

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        normalized_tag = tag.lower()
        values = {name.lower(): value for name, value in attrs}
        element_id = str(values.get("data-yrkie-element-id") or "").strip() or None
        token = self._start_token(
            normalized_tag,
            attrs,
            closed=normalized_tag in self._VOID_TAGS,
        )
        self._append(token)
        parent_id = self._active_ids[-1] if self._active_ids else None
        if element_id is not None:
            if element_id in self.records:
                self.duplicates.add(element_id)
            else:
                self.records[element_id] = {
                    "element_id": element_id,
                    "parent_id": parent_id,
                    "shape_key": str(values.get("data-pptx-shape-key") or "").strip(),
                    "tokens": [token],
                    "order": self._order,
                }
                self._order += 1
            self._active_ids.append(element_id)
        if normalized_tag not in self._VOID_TAGS:
            self._stack.append((normalized_tag, element_id))
        elif element_id is not None:
            self._active_ids.pop()

    def handle_startendtag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        normalized_tag = tag.lower()
        values = {name.lower(): value for name, value in attrs}
        element_id = str(values.get("data-yrkie-element-id") or "").strip() or None
        token = self._start_token(normalized_tag, attrs, closed=True)
        self._append(token)
        parent_id = self._active_ids[-1] if self._active_ids else None
        if element_id is not None:
            if element_id in self.records:
                self.duplicates.add(element_id)
            else:
                self.records[element_id] = {
                    "element_id": element_id,
                    "parent_id": parent_id,
                    "shape_key": str(values.get("data-pptx-shape-key") or "").strip(),
                    "tokens": [token],
                    "order": self._order,
                }
                self._order += 1

    def handle_endtag(self, tag: str) -> None:
        token = f"</{tag.lower()}>"
        self._append(token)
        if not self._stack:
            return
        _open_tag, element_id = self._stack.pop()
        if element_id is not None and self._active_ids:
            self._active_ids.pop()

    def handle_data(self, data: str) -> None:
        self._append(f"#text:{data}")

    def handle_entityref(self, name: str) -> None:
        self._append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        self._append(f"&#{name};")

    def handle_comment(self, data: str) -> None:
        self._append(f"<!--{data}-->")

_StableElementTreeParser.__module__ = 'pptx2html.htmlir.reconcile'
