"""Ordinary HTML/CSS to PresentationIR compiler."""

from .compiler import (
    HtmlCompileError,
    compile_html,
    compile_slide_fragment,
    compile_slide_fragments,
    recover_serialized_html_source,
    capture_html_screenshots,
    print_html_to_pdf,
    warm_browser_snapshot_worker,
)
from .reconcile import reconcile_editable_html_with_current_ir

__all__ = [
    "HtmlCompileError",
    "compile_html",
    "compile_slide_fragment",
    "compile_slide_fragments",
    "recover_serialized_html_source",
    "capture_html_screenshots",
    "print_html_to_pdf",
    "warm_browser_snapshot_worker",
    "reconcile_editable_html_with_current_ir",
]
