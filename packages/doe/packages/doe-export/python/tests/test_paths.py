"""Paths for the isolated v2 export suite; no original application dependencies."""
import os
from pathlib import Path

DOE_ROOT = Path(__file__).resolve().parents[4]
DOE_PUBLIC_ROOT = Path(os.environ.get(
    "YRKIE_SCHEMA_RENDERER_ROOT",
    str(DOE_ROOT.parents[1] / "test/20260909-doe-v2/runtime/yrkie-doe"),
))
