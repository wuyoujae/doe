# Origin: pptx2html/htmlir/compiler.py::_doe_alexandria_codepoints
from __future__ import annotations
from doe_export.html.compiler.shared import Path, lru_cache, os
from doe_export.runtime.paths import public_root

@lru_cache(maxsize=1)
def _doe_alexandria_codepoints() -> tuple[int, ...]:
    from fontTools.ttLib import TTFont

    font_path = (
        public_root()
        / "yrkie-doe/core/fonts/alexandria/Alexandria-wght.ttf"
    )
    if not font_path.is_file():
        return ()
    with TTFont(font_path, lazy=True) as font:
        return tuple(sorted(font.getBestCmap()))

_doe_alexandria_codepoints.__module__ = 'pptx2html.htmlir.compiler'
