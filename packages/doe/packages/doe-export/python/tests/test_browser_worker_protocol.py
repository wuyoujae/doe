from __future__ import annotations

import json
import os
import shutil
import subprocess
import unittest
from pathlib import Path


RUNTIME_ROOT = Path(__file__).resolve().parents[1]
WORKER_SCRIPT = RUNTIME_ROOT / "pptx2html" / "htmlir" / "browser_snapshot.js"


class BrowserWorkerProtocolTests(unittest.TestCase):
    def test_browser_launch_failure_preserves_request_envelope(self) -> None:
        node = shutil.which("node")
        if not node:
            self.skipTest("Node.js is unavailable")

        environment = os.environ.copy()
        environment["PLAYWRIGHT_CHROMIUM_EXECUTABLE"] = str(RUNTIME_ROOT / "package.json")
        request_id = 8301
        completed = subprocess.run(
            [node, str(WORKER_SCRIPT), "--worker"],
            cwd=RUNTIME_ROOT,
            env=environment,
            input=json.dumps({"request_id": request_id, "payload": {"command": "ping"}})
            + "\n",
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        response_lines = [line for line in completed.stdout.splitlines() if line.strip()]
        self.assertEqual(len(response_lines), 1, completed.stdout)
        envelope = json.loads(response_lines[0])
        self.assertEqual(envelope.get("request_id"), request_id)
        result = envelope.get("result")
        self.assertIsInstance(result, dict)
        self.assertFalse(result.get("success"))
        self.assertTrue(str(result.get("error") or "").strip())


if __name__ == "__main__":
    unittest.main()
