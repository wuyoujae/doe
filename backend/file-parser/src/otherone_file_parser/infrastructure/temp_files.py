from __future__ import annotations

import os
import tempfile
import time
from collections.abc import Iterator
from contextlib import contextmanager, suppress
from pathlib import Path


def prepare_temp_directory(root: Path) -> None:
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    # Windows ACLs are inherited from the current user; chmod is best effort there.
    with suppress(OSError):
        root.chmod(0o700)


def cleanup_stale_files(root: Path, ttl_seconds: int, *, now: float | None = None) -> int:
    prepare_temp_directory(root)
    cutoff = (time.time() if now is None else now) - ttl_seconds
    removed = 0
    for candidate in root.iterdir():
        if not candidate.is_file() or not candidate.name.startswith("upload-"):
            continue
        try:
            if candidate.stat().st_mtime < cutoff:
                candidate.unlink()
                removed += 1
        except FileNotFoundError:
            continue
        except OSError:
            # One locked file must not prevent the service from starting.
            continue
    return removed


@contextmanager
def managed_temp_path(root: Path, suffix: str) -> Iterator[Path]:
    prepare_temp_directory(root)
    descriptor, raw_path = tempfile.mkstemp(prefix="upload-", suffix=suffix, dir=root)
    os.close(descriptor)
    path = Path(raw_path)
    try:
        with suppress(OSError):
            path.chmod(0o600)
        yield path
    finally:
        # A cancelled request may leave Docling briefly holding the file on Windows.
        # Do not mask the original error; startup TTL cleanup will retry it later.
        with suppress(OSError):
            path.unlink()
