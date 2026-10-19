import os
from pathlib import Path

RUNTIME_ROOT = Path(__file__).resolve().parents[2]


def public_root() -> Path:
    return Path(os.environ.get("YRKIE_DOE_PUBLIC_ROOT") or RUNTIME_ROOT / "public")
