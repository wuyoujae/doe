# Origin: pptx2html/htmlir/reconcile.py::_stable_element_records
from __future__ import annotations
from doe_export.html.reconcile.shared import Any, hashlib
from doe_export.html.reconcile.identity._StableElementTreeParser import _StableElementTreeParser

def _stable_element_records(source: str) -> tuple[dict[str, dict[str, Any]], set[str]]:
    parser = _StableElementTreeParser()
    parser.feed(source)
    parser.close()
    for record in parser.records.values():
        record["fingerprint"] = hashlib.sha256(
            "\x1f".join(record.pop("tokens")).encode("utf-8")
        ).hexdigest()
    return parser.records, parser.duplicates

_stable_element_records.__module__ = 'pptx2html.htmlir.reconcile'
