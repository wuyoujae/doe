# Origin: pptx2html/htmlir/compiler.py::_linux_process_tree_rss_bytes
from __future__ import annotations
from doe_export.html.compiler.shared import Path, os

def _linux_process_tree_rss_bytes(root_pid: int) -> int | None:
    if os.name == "nt" or not Path("/proc").is_dir():
        return None
    pending = [root_pid]
    visited: set[int] = set()
    rss_kib = 0
    root_seen = False
    while pending and len(visited) < 1024:
        pid = pending.pop()
        if pid in visited:
            continue
        visited.add(pid)
        status_path = Path(f"/proc/{pid}/status")
        try:
            status = status_path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if pid == root_pid:
            root_seen = True
        for line in status.splitlines():
            if line.startswith("VmRSS:"):
                fields = line.split()
                if len(fields) >= 2 and fields[1].isdigit():
                    rss_kib += int(fields[1])
                break
        try:
            children = Path(f"/proc/{pid}/task/{pid}/children").read_text(
                encoding="ascii",
                errors="strict",
            )
        except OSError:
            continue
        pending.extend(int(value) for value in children.split() if value.isdigit())
    return rss_kib * 1024 if root_seen else None

_linux_process_tree_rss_bytes.__module__ = 'pptx2html.htmlir.compiler'
