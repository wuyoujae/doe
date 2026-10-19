# Origin: pptx2html/htmlir/compiler.py::_css_color
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_alpha_value import _css_alpha_value
from doe_export.html.compiler.css._css_rgb_channel import _css_rgb_channel

def _css_color(value: Any) -> tuple[str, float] | None:
    raw = str(value or "").strip()
    if not raw or raw.lower() == "transparent":
        return None
    hex_match = re.fullmatch(r"#([0-9a-fA-F]{3,8})", raw)
    if hex_match:
        digits = hex_match.group(1)
        if len(digits) in {3, 4}:
            digits = "".join(ch * 2 for ch in digits)
        alpha = 1.0
        if len(digits) == 8:
            alpha = int(digits[6:8], 16) / 255.0
            digits = digits[:6]
        return digits.upper(), alpha
    match = re.fullmatch(r"rgba?\(([^)]+)\)", raw, re.IGNORECASE)
    if match:
        body = match.group(1).strip()
        if "," in body:
            parts = [part.strip() for part in re.split(r",|/", body) if part.strip()]
        else:
            color_body, sep, alpha_body = body.partition("/")
            parts = [part.strip() for part in color_body.split() if part.strip()]
            if sep and alpha_body.strip():
                parts.append(alpha_body.strip())
        if len(parts) >= 3:
            rgb = []
            for part in parts[:3]:
                rgb.append(_css_rgb_channel(part))
            if len(parts) >= 4:
                alpha = _css_alpha_value(parts[3])
            else:
                alpha = 1.0
            return "".join(f"{max(0, min(255, value)):02X}" for value in rgb), alpha
    modern_match = re.fullmatch(r"color\(\s*([a-zA-Z0-9-]+)\s+(.+)\)", raw, re.IGNORECASE)
    if modern_match:
        body = modern_match.group(2).strip()
        color_body, sep, alpha_body = body.partition("/")
        parts = [part.strip() for part in color_body.split() if part.strip()]
        if len(parts) >= 3:
            rgb = [_css_rgb_channel(part, unit_interval=True) for part in parts[:3]]
            alpha = _css_alpha_value(alpha_body) if sep and alpha_body.strip() else 1.0
            return "".join(f"{value:02X}" for value in rgb), alpha
    named = {"white": "FFFFFF", "black": "000000", "transparent": None}
    found = named.get(raw.lower())
    return (found, 1.0) if found else None

_css_color.__module__ = 'pptx2html.htmlir.compiler'
