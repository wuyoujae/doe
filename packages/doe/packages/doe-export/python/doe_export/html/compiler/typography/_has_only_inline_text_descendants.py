# Origin: pptx2html/htmlir/compiler.py::_has_only_inline_text_descendants
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import TABLE_NATIVE_TEXT_CHILD_TAGS
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.document._path_is_descendant import _path_is_descendant

def _has_only_inline_text_descendants(path: str, nodes_by_path: dict[str, dict[str, Any]]) -> bool:
    if not path or not nodes_by_path:
        return False
    found = False
    for candidate_path, candidate in nodes_by_path.items():
        if candidate_path == path or not _path_is_descendant(candidate_path, path):
            continue
        if not candidate.get("visible"):
            continue
        found = True
        tag = str(candidate.get("tag") or "").lower()
        if tag not in TABLE_NATIVE_TEXT_CHILD_TAGS:
            return False
        display = str(_computed(candidate).get("display") or "").strip().lower()
        if tag != "br" and display and not display.startswith("inline"):
            return False
    return found

_has_only_inline_text_descendants.__module__ = 'pptx2html.htmlir.compiler'
