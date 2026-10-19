from __future__ import annotations

import io

import pytest
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

from browser_font_subset import (
    BrowserFontSubsetError,
    normalize_subset_characters,
    subset_browser_font,
    subset_browser_font_isolated,
)
from pptx2html.htmlir.reconcile import _project_browser_fonts
from pptx_pipeline import _apply_browser_asset_overrides_to_ir


def _test_font(*, fs_type: int = 0) -> bytes:
    glyph_order = [".notdef", "space", "A", "B", "uni4E2D"]
    builder = FontBuilder(1_000, isTTF=True)
    builder.setupGlyphOrder(glyph_order)
    builder.setupCharacterMap({32: "space", 65: "A", 66: "B", 0x4E2D: "uni4E2D"})

    glyphs = {}
    for glyph_name in glyph_order:
        pen = TTGlyphPen(None)
        if glyph_name not in {".notdef", "space"}:
            pen.moveTo((80, 0))
            pen.lineTo((500, 800))
            pen.lineTo((920, 0))
            pen.closePath()
        glyphs[glyph_name] = pen.glyph()
    builder.setupGlyf(glyphs)
    builder.setupHorizontalMetrics(
        {glyph_name: (1_000, 0) for glyph_name in glyph_order}
    )
    builder.setupHorizontalHeader(ascent=800, descent=-200)
    builder.setupOS2(
        sTypoAscender=800,
        sTypoDescender=-200,
        usWinAscent=800,
        usWinDescent=200,
        fsType=fs_type,
    )
    builder.setupNameTable(
        {
            "familyName": "YrkIe Test Font",
            "styleName": "Regular",
            "uniqueFontIdentifier": "YrkIe Test Font Regular",
            "fullName": "YrkIe Test Font Regular",
            "psName": "YrkIeTestFont-Regular",
        }
    )
    builder.setupPost()
    builder.setupMaxp()
    output = io.BytesIO()
    builder.save(output)
    return output.getvalue()


def test_subsets_font_to_deterministic_woff2() -> None:
    source = _test_font()
    first = subset_browser_font(source, "中A A")
    second = subset_browser_font(source, " A中")

    assert first.content_type == "font/woff2"
    assert first.data[:4] == b"wOF2"
    assert first.sha256 == second.sha256
    assert first.data == second.data
    assert first.character_count == 3
    assert len(first.data) < len(source)

    font = TTFont(io.BytesIO(first.data))
    assert font.getBestCmap().keys() == {32, 65, 0x4E2D}


def test_subsets_font_in_an_isolated_worker() -> None:
    result = subset_browser_font_isolated(
        _test_font(),
        "A中",
        timeout_seconds=10,
    )
    assert result.data[:4] == b"wOF2"


def test_normalizes_characters_without_hidden_control_bytes() -> None:
    assert normalize_subset_characters("B\x00A\ufeffA") == "AB"


@pytest.mark.parametrize(
    ("fs_type", "error_code"),
    [
        (0x0002, "browser-font-license-restricted"),
        (0x0100, "browser-font-license-no-subsetting"),
    ],
)
def test_rejects_font_license_bits_that_forbid_delivery(
    fs_type: int,
    error_code: str,
) -> None:
    with pytest.raises(BrowserFontSubsetError) as caught:
        subset_browser_font(_test_font(fs_type=fs_type), "A")
    assert caught.value.code == error_code


def test_projects_browser_font_variant_without_changing_original_ir() -> None:
    source = "a" * 64
    variant = "b" * 64
    presentation = {
        "embedded_fonts": [
            {
                "typeface": "Source Font",
                "content_type": "font/otf",
                "data": f"yrkie-asset-data://{source}",
            }
        ],
        "slides": [{"shapes": []}],
    }
    projected = _apply_browser_asset_overrides_to_ir(
        presentation,
        {source: variant},
        [],
    )
    assert projected["embedded_fonts"][0]["data"].endswith(variant)
    assert presentation["embedded_fonts"][0]["data"].endswith(source)

    suppressed = _project_browser_fonts(presentation, {}, [source])
    assert suppressed["embedded_fonts"] == []
    assert len(presentation["embedded_fonts"]) == 1
