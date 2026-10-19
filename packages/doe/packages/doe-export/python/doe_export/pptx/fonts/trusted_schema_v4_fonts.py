# Origin: schema_v4_fonts.py::trusted_schema_v4_fonts
from __future__ import annotations
from .shared import Path, TrustedFontFace

def trusted_schema_v4_fonts(renderer_root: Path) -> tuple[TrustedFontFace, ...]:
    font_root = renderer_root / "core" / "fonts"
    legacy_root = font_root / "infaxiswield-humanist"
    misans_root = font_root / "misans"
    alexandria_root = font_root / "alexandria"
    faces = (
        TrustedFontFace(
            "Infaxiswield Humanist",
            "normal",
            400,
            "regular",
            legacy_root / "InfaxiswieldHumanist-Regular.woff2",
        ),
        TrustedFontFace(
            "Infaxiswield Humanist",
            "normal",
            700,
            "bold",
            legacy_root / "InfaxiswieldHumanist-Bold.woff2",
        ),
        TrustedFontFace(
            "Infaxiswield Humanist",
            "italic",
            400,
            "italic",
            legacy_root / "InfaxiswieldHumanist-Italic.woff2",
        ),
        TrustedFontFace(
            "MiSans",
            "normal",
            300,
            "regular",
            misans_root / "MiSans-Light.woff2",
        ),
        TrustedFontFace(
            "MiSans Medium",
            "normal",
            400,
            "regular",
            misans_root / "MiSans-Medium.woff2",
            ("MiSans",),
        ),
        TrustedFontFace(
            "MiSans",
            "normal",
            600,
            "bold",
            misans_root / "MiSans-Semibold.woff2",
        ),
        TrustedFontFace(
            "Alexandria",
            "normal",
            300,
            "regular",
            alexandria_root / "Alexandria-wght.ttf",
        ),
        TrustedFontFace(
            "Alexandria Medium",
            "normal",
            400,
            "regular",
            alexandria_root / "Alexandria-wght.ttf",
            ("Alexandria",),
        ),
        TrustedFontFace(
            "Alexandria",
            "normal",
            600,
            "bold",
            alexandria_root / "Alexandria-wght.ttf",
        ),
    )
    return faces + tuple(
        TrustedFontFace(face.family + " Tabular", face.style, face.weight, face.slot,
                        face.path, ("Alexandria",))
        for face in faces if face.family in {"Alexandria", "Alexandria Medium"}
    )

trusted_schema_v4_fonts.__module__ = 'schema_v4_fonts'
