from __future__ import annotations

from test_paths import DOE_PUBLIC_ROOT

import sys
import unittest
from pathlib import Path
from modular_patch import patch

RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from export_studio_deck import export_payload  # noqa: E402


class StudioDeckExportTests(unittest.TestCase):
    def test_routes_the_complete_deck_to_the_editable_exporter(self) -> None:
        deck = {
            "version": 4,
            "deck": {"title": "Studio", "slides": [{"id": "slide-1"}]},
        }
        with patch(
            "export_studio_deck.export_schema_v4_deck_to_pptx",
            return_value=b"pptx",
        ) as exporter:
            result = export_payload({"deck": deck})

        self.assertEqual(result, b"pptx")
        exporter.assert_called_once_with(
            deck,
            export_watermark=False,
            output_mode="editable",
        )

    def test_rejects_a_missing_deck(self) -> None:
        with self.assertRaisesRegex(ValueError, "Deck object"):
            export_payload({})

    def test_preview_layout_is_a_side_channel_not_author_data(self) -> None:
        deck = {"version": 4, "deck": {"slides": [{"id": "slide-1"}]}}
        preview = {"version": "flow-v1", "pageMarginPt": 64}
        with patch("export_studio_deck.export_schema_v4_deck_to_pptx", return_value=b"pptx") as exporter:
            export_payload({"deck": deck, "flowLayout": preview})
        exporter.assert_called_once_with(deck, export_watermark=False, output_mode="editable", flow_layout=preview)
        self.assertNotIn("flowLayout", deck)


if __name__ == "__main__":
    unittest.main()
