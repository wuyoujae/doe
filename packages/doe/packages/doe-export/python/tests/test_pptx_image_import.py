from __future__ import annotations

import base64
import sys
import tempfile
import unittest
from pathlib import Path


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from pptx2html.ir.builder import PresentationBuilder  # noqa: E402
from pptx2html.pom.presentation import Presentation as PomPresentation  # noqa: E402
from pptx2html.server.pptx_writer import write_pptx_from_ir  # noqa: E402


PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF"
    "gAJ/lzQJLwAAAABJRU5ErkJggg=="
)


def image_ir() -> dict:
    return {
        "content_type": "image/png",
        "data": base64.b64encode(PNG_BYTES).decode("ascii"),
    }


def presentation_ir(*, background: dict | None = None, effects: list[dict] | None = None) -> dict:
    return {
        "width": 960,
        "height": 540,
        "slides": [
            {
                "index": 0,
                "background": background,
                "shapes": [
                    {
                        "type": "picture",
                        "shape_id": 2,
                        "name": "Picture 1",
                        "bounds": {"left": 24, "top": 24, "width": 120, "height": 80},
                        "image": image_ir(),
                        "effects": effects or [],
                    }
                ],
            }
        ],
    }


def import_written_pptx(ir: dict):
    with tempfile.TemporaryDirectory() as temp_dir:
        path = Path(temp_dir) / "minimal.pptx"
        write_pptx_from_ir(ir, path)
        with PomPresentation.open(str(path)) as pom:
            return PresentationBuilder().build(pom)


class PptxImageImportTests(unittest.TestCase):
    def test_picture_slide_background_resolves_its_slide_relationship(self) -> None:
        imported = import_written_pptx(
            presentation_ir(background={"fill": {"type": "picture", "image": image_ir()}})
        )

        background_image = imported.slides[0].background.fill.image
        self.assertEqual(background_image.content_type, "image/png")
        self.assertEqual(base64.b64decode(background_image.data), PNG_BYTES)
        self.assertTrue(background_image.embed_id.endswith(".png"))

    def test_picture_blip_grayscale_is_preserved_as_an_image_effect(self) -> None:
        imported = import_written_pptx(
            presentation_ir(effects=[{"type": "grayscale", "alpha": 1.0}])
        )

        picture = imported.slides[0].shapes[0]
        self.assertEqual(
            [(effect.type, effect.alpha) for effect in picture.image.effects],
            [("grayscale", 1.0)],
        )
        self.assertNotIn("grayscale", [effect.type for effect in picture.effects])
        self.assertIsNone(picture.shadow)

    def test_table_cell_picture_fill_resolves_its_graphic_frame_relationship(self) -> None:
        ir = presentation_ir()
        ir["slides"][0]["shapes"] = [
            {
                "type": "graphic_frame",
                "shape_id": 3,
                "name": "Table 1",
                "bounds": {"left": 24, "top": 24, "width": 120, "height": 80},
                "table": {
                    "rows": [[{"text": "Cell", "fill": {"type": "picture", "image": image_ir()}}]],
                    "col_widths": [120],
                    "row_heights": [80],
                },
            }
        ]

        imported = import_written_pptx(ir)

        cell_image = imported.slides[0].shapes[0].table.rows[0][0].fill.image
        self.assertEqual(cell_image.content_type, "image/png")
        self.assertEqual(base64.b64decode(cell_image.data), PNG_BYTES)
        self.assertTrue(cell_image.embed_id.endswith(".png"))


if __name__ == "__main__":
    unittest.main()
