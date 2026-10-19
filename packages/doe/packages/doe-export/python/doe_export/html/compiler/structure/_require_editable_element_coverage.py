# Origin: pptx2html/htmlir/compiler.py::_require_editable_element_coverage
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import ALWAYS_UNSUPPORTED_EDITABLE_TAGS, EDITABLE_HTML_TAGS, SVG_NAMESPACE
from doe_export.html.compiler.diagnostics.HtmlCompileError import HtmlCompileError
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.svg._collect_svg_coverage_violations import _collect_svg_coverage_violations

def _require_editable_element_coverage(ast: dict[str, Any]) -> None:
    unsupported: set[str] = set()
    pseudo_violations: set[tuple[str, str]] = set()
    text_pseudo_violations: set[tuple[str, str]] = set()
    svg_violations: set[tuple[str, str, str | None]] = set()
    for node in ast.get("nodes") or []:
        if not isinstance(node, dict) or node.get("nodeType") != "element":
            continue
        tag = str(node.get("tag") or "").strip().lower()
        if tag in {"::before", "::after"}:
            continue
        if tag in ALWAYS_UNSUPPORTED_EDITABLE_TAGS:
            unsupported.add(tag)
        pseudo = node.get("pseudo") if isinstance(node.get("pseudo"), dict) else {}
        for pseudo_name in ("before", "after"):
            pseudo_value = pseudo.get(pseudo_name)
            if not isinstance(pseudo_value, dict):
                continue
            content = str(pseudo_value.get("content") or "").strip().lower()
            if content and content not in {"none", "normal"}:
                pseudo_violations.add((tag or "unknown", pseudo_name))
        for pseudo_name in ("firstLetter", "firstLine"):
            pseudo_value = pseudo.get(pseudo_name)
            if isinstance(pseudo_value, dict) and pseudo_value.get("differences"):
                text_pseudo_violations.add((tag or "unknown", pseudo_name))
        namespace = str(node.get("namespaceURI") or "").strip().lower()
        if namespace == SVG_NAMESPACE:
            _collect_svg_coverage_violations(node, tag, svg_violations)
            continue
        if node.get("visible") and tag not in EDITABLE_HTML_TAGS:
            unsupported.add(tag or "unknown")
    if (
        not unsupported
        and not pseudo_violations
        and not text_pseudo_violations
        and not svg_violations
    ):
        return
    tags = sorted(unsupported)[:16]
    diagnostics = [
        HtmlDiagnostic(
            "error",
            "unsupported-visible-element",
            (
                f"Visible <{tag}> is not covered by the editable HTML V1 mapping; "
                "the slide was rejected before partial conversion."
            ),
            tag=tag if tag != "unknown" else None,
        )
        for tag in tags
    ]
    for tag, pseudo_name in sorted(pseudo_violations)[: max(0, 32 - len(diagnostics))]:
        diagnostics.append(
            HtmlDiagnostic(
                "error",
                "unsupported-pseudo-content",
                (
                    f"<{tag}>::{pseudo_name} defines CSS generated content, which is not "
                    "covered by the editable HTML V1 mapping; the slide was rejected "
                    "before partial conversion."
                ),
                tag=tag if tag != "unknown" else None,
                attribute=f"::{pseudo_name}",
            )
        )
    pseudo_attribute_names = {"firstLetter": "::first-letter", "firstLine": "::first-line"}
    for tag, pseudo_name in sorted(text_pseudo_violations)[: max(0, 32 - len(diagnostics))]:
        attribute = pseudo_attribute_names[pseudo_name]
        diagnostics.append(
            HtmlDiagnostic(
                "error",
                "unsupported-text-pseudo-style",
                (
                    f"<{tag}>{attribute} changes computed text styling, which is not "
                    "covered by the editable HTML V1 mapping; the slide was rejected "
                    "before partial conversion."
                ),
                tag=tag if tag != "unknown" else None,
                attribute=attribute,
            )
        )
    for code, tag, attribute in sorted(svg_violations)[: max(0, 32 - len(diagnostics))]:
        if code == "unsupported-svg-element":
            message = (
                f"SVG <{tag}> is not covered by the editable SVG V1 primitive mapping; "
                "the slide was rejected before partial conversion."
            )
        else:
            message = (
                f"SVG <{tag}> uses unsupported visual feature '{attribute}'; "
                "the slide was rejected before partial conversion."
            )
        diagnostics.append(
            HtmlDiagnostic(
                "error",
                code,
                message,
                tag=tag or None,
                attribute=attribute,
            )
        )
    raise HtmlCompileError("Unsupported visible HTML element", diagnostics)

_require_editable_element_coverage.__module__ = 'pptx2html.htmlir.compiler'
