# Origin: pptx2html/ir/builder.py::PresentationBuilder._parse_theme_fonts
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE

@staticmethod
def _parse_theme_fonts(theme_elem: ET.Element) -> dict[str, str]:
    _A = NAMESPACE.DML_MAIN
    font_scheme = theme_elem.find(f".//{{{_A}}}fontScheme")
    if font_scheme is None:
        return {}

    fonts: dict[str, str] = {}
    for kind, prefix in (("majorFont", "major"), ("minorFont", "minor")):
        font_group = font_scheme.find(f"{{{_A}}}{kind}")
        if font_group is None:
            continue
        for tag, slot in (
            ("latin", "latin"),
            ("ea", "ea"),
            ("cs", "cs"),
        ):
            font_elem = font_group.find(f"{{{_A}}}{tag}")
            if font_elem is not None:
                typeface = font_elem.get("typeface")
                if typeface:
                    fonts[f"{prefix}_{slot}"] = typeface

        if f"{prefix}_ea" not in fonts:
            for supplemental in font_group.findall(f"{{{_A}}}font"):
                script = (supplemental.get("script") or "").lower()
                typeface = supplemental.get("typeface")
                if typeface and script in {"hans", "hant", "jpan", "hang"}:
                    fonts[f"{prefix}_ea"] = typeface
                    break

    return fonts

_parse_theme_fonts.__func__.__module__ = 'pptx2html.ir.builder'
_parse_theme_fonts.__func__.__qualname__ = 'PresentationBuilder._parse_theme_fonts'
