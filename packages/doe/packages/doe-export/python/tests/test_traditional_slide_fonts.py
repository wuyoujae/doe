from __future__ import annotations

from test_paths import DOE_PUBLIC_ROOT

import base64
import shutil
import sys
import unittest
from pathlib import Path


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = RUNTIME_ROOT
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.htmlir.compiler import HtmlCompileError, compile_slide_fragment  # noqa: E402


FONT_CASES = [
    ("font-fraunces", "Fraunces", "Editorial signal"),
    ("font-manrope", "Manrope", "Product clarity"),
    ("font-infaxis", "Infaxiswield Humanist", "人文复合字体"),
    ("font-lora", "Lora", "Narrative rhythm"),
    ("font-source-han-serif", "Source Han Serif", "思源宋体预览"),
    ("font-noto-sans-sc", "Noto Sans SC", "简体中文黑体"),
    ("font-outfit", "Outfit", "Geometric display"),
]


def font_families(value: object) -> set[str]:
    families: set[str] = set()
    if isinstance(value, dict):
        font = value.get("font")
        if isinstance(font, dict) and isinstance(font.get("family"), str):
            families.add(font["family"])
        for child in value.values():
            families.update(font_families(child))
    elif isinstance(value, list):
        for child in value:
            families.update(font_families(child))
    return families


def text_run_fonts(value: object) -> dict[str, str]:
    runs: dict[str, str] = {}
    if isinstance(value, dict):
        text = value.get("text")
        font = value.get("font")
        if (
            isinstance(text, str)
            and isinstance(font, dict)
            and isinstance(font.get("family"), str)
        ):
            runs[text] = font["family"]
        for child in value.values():
            runs.update(text_run_fonts(child))
    elif isinstance(value, list):
        for child in value:
            runs.update(text_run_fonts(child))
    return runs


class TraditionalSlideFontTests(unittest.TestCase):
    def test_template_exposes_stable_ai_font_classes(self) -> None:
        template = (REPOSITORY_ROOT / "resources" / "template" / "tmp.html").read_text(
            encoding="utf-8"
        )
        for class_name, family, _sample in FONT_CASES:
            self.assertIn(f".{class_name}", template)
            self.assertIn(f'"{family}"', template)
        self.assertIn('--font-default: "Outfit", "Noto Sans SC"', template)
        self.assertIn('--font-sans-en: "Outfit"', template)

    @unittest.skipUnless(shutil.which("node"), "Node.js is unavailable")
    def test_browser_resolves_default_english_and_chinese_fonts_without_classes(self) -> None:
        fragment = """
        <section class="w-full h-full bg-white p-16">
          <div style="font-size:72px">Default English heading</div>
          <div style="font-size:72px">默认中文标题</div>
        </section>
        """

        result = compile_slide_fragment(
            fragment,
            include_browser_screenshot=False,
            timeout_ms=60_000,
        )
        runs = text_run_fonts(result["presentation"])
        self.assertEqual(runs["Default English heading"], "Outfit")
        self.assertEqual(runs["默认中文标题"], "Noto Sans SC")

    @unittest.skipUnless(shutil.which("node"), "Node.js is unavailable")
    def test_browser_compiles_all_traditional_slide_fonts_with_a_real_png(self) -> None:
        rows = "".join(
            f'<div class="{class_name}" style="font-size:64px;line-height:1.1">{sample}</div>'
            for class_name, _family, sample in FONT_CASES
        )
        fragment = (
            '<section class="w-full h-full bg-white p-16 flex flex-col justify-between">'
            f"{rows}"
            "</section>"
        )

        try:
            result = compile_slide_fragment(
                fragment,
                include_browser_screenshot=True,
                timeout_ms=60_000,
            )
        except HtmlCompileError as error:
            if "browser" in str(error).lower() and "unavailable" in str(error).lower():
                self.skipTest(str(error))
            raise

        families = font_families(result["presentation"])
        self.assertTrue({family for _class, family, _sample in FONT_CASES}.issubset(families))
        screenshot = base64.b64decode(result["browser_screenshot_png_base64"])
        self.assertTrue(screenshot.startswith(b"\x89PNG\r\n\x1a\n"))
        self.assertGreater(len(screenshot), 20_000)


if __name__ == "__main__":
    unittest.main()
