# Origin: pptx2html/htmlir/compiler.py::HtmlDiagnostic
from __future__ import annotations
from doe_export.html.compiler.shared import dataclass, dataclasses

@dataclass
class HtmlDiagnostic:
    severity: str
    code: str
    message: str
    line: int | None = None
    column: int | None = None
    tag: str | None = None
    attribute: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self)

HtmlDiagnostic.__module__ = 'pptx2html.htmlir.compiler'
