# Origin: pptx_pipeline.py::_assert_no_inline_binary_html
from __future__ import annotations
from doe_export.pipeline.assets._InlineAssetHtmlGuard import _InlineAssetHtmlGuard

def _assert_no_inline_binary_html(source: str) -> None:
    guard = _InlineAssetHtmlGuard()
    guard.feed(source)
    guard.close()
    if guard.has_inline_asset:
        raise ValueError("Editable HTML cannot contain inline data URLs.")

_assert_no_inline_binary_html.__module__ = 'pptx_pipeline'
