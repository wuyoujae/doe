# Origin: schema_v4_fonts.py::trusted_traditional_slide_fonts
from __future__ import annotations
from .shared import Path, TrustedFontFace

def trusted_traditional_slide_fonts(frontend_public_root: Path) -> tuple[TrustedFontFace, ...]:
    root = frontend_public_root.resolve(strict=True)
    if not root.is_dir():
        raise ValueError("Traditional Slide public font root is invalid.")
    faces: list[TrustedFontFace] = []

    def add_variable_family(
        family: str,
        normal_path: Path,
        *,
        italic_path: Path | None = None,
        source_families: tuple[str, ...] = (),
        bold_weight: int = 700,
    ) -> None:
        faces.extend(
            (
                TrustedFontFace(family, "normal", 400, "regular", normal_path, source_families),
                TrustedFontFace(family, "normal", bold_weight, "bold", normal_path, source_families),
            )
        )
        if italic_path is not None:
            faces.extend(
                (
                    TrustedFontFace(family, "italic", 400, "italic", italic_path, source_families),
                    TrustedFontFace(family, "italic", bold_weight, "boldItalic", italic_path, source_families),
                )
            )

    add_variable_family(
        "Fraunces",
        root / "fonts" / "v5.3.0" / "fraunces-latin-wght-normal.woff2",
        italic_path=root / "fonts" / "v5.3.0" / "fraunces-latin-wght-italic.woff2",
    )
    add_variable_family(
        "Outfit",
        root / "fonts" / "traditional-slide" / "outfit-latin-wght-normal.woff2",
        source_families=("Outfit Thin",),
    )
    add_variable_family(
        "Manrope",
        root / "fonts" / "v5.3.0" / "manrope-latin-wght-normal.woff2",
        source_families=("Manrope ExtraLight",),
    )
    add_variable_family(
        "Lora",
        root / "fonts" / "traditional-slide" / "lora-latin-wght-normal.woff2",
        italic_path=root / "fonts" / "traditional-slide" / "lora-latin-wght-italic.woff2",
    )
    theme_fonts = root / 'yrkie-doe' / 'core' / 'fonts'
    for slot, style, weight, filename in [
        ('regular', 'normal', 400, 'Tomorrow-Regular.ttf'),
        ('bold', 'normal', 700, 'Tomorrow-Bold.ttf'),
        ('italic', 'italic', 400, 'Tomorrow-Italic.ttf'),
        ('boldItalic', 'italic', 700, 'Tomorrow-BoldItalic.ttf'),
    ]:
        faces.append(TrustedFontFace('Tomorrow', style, weight, slot, theme_fonts / 'tomorrow' / filename, ()))
    add_variable_family('ZCOOL QingKe HuangYou', theme_fonts / 'zcool-qingke-huangyou' / 'ZCOOLQingKeHuangYou-Regular.ttf')
    add_variable_family('Fredoka', theme_fonts / 'fredoka' / 'fredoka-variable.ttf', bold_weight=600)
    add_variable_family('Caveat', theme_fonts / 'caveat' / 'caveat-variable.ttf', bold_weight=600)
    for slug, family in [('eb-garamond', 'EB Garamond'), ('ibm-plex-mono', 'IBM Plex Mono')]:
        for slot, style, weight in [('regular', 'normal', 400), ('bold', 'normal', 600),
                                    ('italic', 'italic', 400), ('boldItalic', 'italic', 600)]:
            faces.append(TrustedFontFace(family, style, weight, slot,
                theme_fonts / slug / f'{slug}-latin-{weight}-{style}.woff2',
                ('IBM Plex Mono SemiBold',) if family == 'IBM Plex Mono' and weight == 600 else ()))
    return tuple(faces)

trusted_traditional_slide_fonts.__module__ = 'schema_v4_fonts'
