from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path
from modular_patch import patch


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from slide_repair_render_gate import (  # noqa: E402
    SlideRepairRenderGateError,
    validate_slide_repair_deck,
)


class SlideRepairRenderGateTests(unittest.TestCase):
    def test_business_preservation_detects_dropped_content_without_exposing_it(self) -> None:
        script = """
const { businessPreservation } = require('./slide_repair_render_gate.js');
const source = {
  id: 'slide-1', size: { width: 960, height: 540, unit: 'pt' },
  blocks: [{ id: 'stat', type: 'stat', props: { value: '42%', source: '已确认来源' } }],
};
const preserved = businessPreservation(source, structuredClone(source));
const dropped = businessPreservation(source, {
  id: 'slide-1', size: { width: 960, height: 540, unit: 'pt' }, blocks: [],
});
process.stdout.write(JSON.stringify({ preserved, dropped }));
"""
        completed = subprocess.run(
            ["node", "-e", script],
            cwd=RUNTIME_ROOT,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        report = json.loads(completed.stdout)
        self.assertTrue(report["preserved"]["preserved"])
        self.assertEqual(report["preserved"]["missingCount"], 0)
        self.assertFalse(report["dropped"]["preserved"])
        self.assertGreater(report["dropped"]["missingCount"], 0)
        self.assertNotIn("已确认来源", completed.stdout.decode("utf-8"))

    def test_business_preservation_ignores_only_non_rendered_component_title(self) -> None:
        script = """
const { businessPreservation } = require('./slide_repair_render_gate.js');
const source = {
  id: 'slide-1', size: { width: 960, height: 540, unit: 'pt' },
  blocks: [{
    id: 'donut', type: 'donut-chart', props: {
      title: 'Legacy hidden title',
      content: { center: { title: 'Visible center' }, items: [{ label: 'Visible share', value: 100 }] },
    },
  }],
};
const withoutRootTitle = structuredClone(source);
delete withoutRootTitle.blocks[0].props.title;
const withoutCenterTitle = structuredClone(withoutRootTitle);
delete withoutCenterTitle.blocks[0].props.content.center.title;
process.stdout.write(JSON.stringify({
  withoutRootTitle: businessPreservation(source, withoutRootTitle),
  withoutCenterTitle: businessPreservation(source, withoutCenterTitle),
}));
"""
        completed = subprocess.run(
            ["node", "-e", script],
            cwd=RUNTIME_ROOT,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        report = json.loads(completed.stdout)
        self.assertTrue(report["withoutRootTitle"]["preserved"])
        self.assertFalse(report["withoutCenterTitle"]["preserved"])

    def test_candidate_rejection_is_a_typed_report_not_an_infrastructure_error(self) -> None:
        report = {
            "success": False,
            "contract": "yrkie-slide-repair-render-gate-v1",
            "pages": [{"page_index": 0, "accepted": False}],
        }
        completed = subprocess.CompletedProcess(
            args=["node"],
            returncode=2,
            stdout=json.dumps(report).encode("utf-8"),
            stderr=b"",
        )
        deck = {"version": 4, "deck": {"slides": [{"id": "slide-1"}]}}
        with patch(
            "slide_repair_render_gate._node_executable", return_value="node"
        ), patch("slide_repair_render_gate.subprocess.run", return_value=completed):
            self.assertEqual(validate_slide_repair_deck(deck), report)

    def test_invalid_deck_never_starts_node(self) -> None:
        with patch("slide_repair_render_gate.subprocess.run") as run:
            with self.assertRaises(SlideRepairRenderGateError):
                validate_slide_repair_deck({"version": 3, "deck": {"slides": []}})
        run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
