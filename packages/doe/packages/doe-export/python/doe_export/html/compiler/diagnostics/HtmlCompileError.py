# Origin: pptx2html/htmlir/compiler.py::HtmlCompileError
from __future__ import annotations

class HtmlCompileError(ValueError):
    def __init__(self, message: str, diagnostics: list[HtmlDiagnostic]):
        super().__init__(message)
        self.diagnostics = diagnostics

    def to_response(self) -> dict[str, Any]:
        return {
            "success": False,
            "error": str(self),
            "diagnostics": [item.to_dict() for item in self.diagnostics],
        }

HtmlCompileError.__module__ = 'pptx2html.htmlir.compiler'
