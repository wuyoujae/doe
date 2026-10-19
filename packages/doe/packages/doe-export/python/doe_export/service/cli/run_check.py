# Origin: htmlir_server.py::run_check
from __future__ import annotations
from doe_export.service.shared import Path, json, parse_html_to_ir

def run_check(path: Path, render_mode: str) -> None:
    source = path.read_text(encoding="utf-8")
    result = parse_html_to_ir(
        source,
        include_ast=False,
        include_browser_screenshot=False,
        render_mode=render_mode,
    )
    slide = result["presentation"]["slides"][0]
    print(
        json.dumps(
            {
                "success": result.get("success"),
                "slide_count": len(result["presentation"]["slides"]),
                "shape_count": len(slide.get("shapes") or []),
                "diagnostic_count": len(result.get("diagnostics") or []),
            },
            ensure_ascii=False,
        )
    )

run_check.__module__ = 'htmlir_server'
