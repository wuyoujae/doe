# Origin: schema_v4_export.py::_node_executable
from __future__ import annotations
from .shared import Path, SchemaV4ExportError, os, shutil, stat

def _node_executable() -> str:
    configured = os.environ.get("YRKIE_HTMLIR_NODE_EXECUTABLE", "").strip()
    if not configured:
        discovered = shutil.which("node")
        if not discovered:
            raise SchemaV4ExportError("Node.js is required for Schema v4 export.")
        return discovered

    candidate = Path(configured)
    try:
        resolved = candidate.resolve(strict=True)
        metadata = resolved.stat()
    except OSError as error:
        raise SchemaV4ExportError("The configured Node.js runtime is unavailable.") from error
    if not candidate.is_absolute() or not stat.S_ISREG(metadata.st_mode):
        raise SchemaV4ExportError("The configured Node.js runtime is invalid.")
    if os.name == "posix" and (
        metadata.st_mode & 0o022
        or not metadata.st_mode & stat.S_IXUSR
        or metadata.st_uid != 0
        or metadata.st_gid != 0
    ):
        raise SchemaV4ExportError("The configured Node.js runtime is unsafe.")
    return str(resolved)

_node_executable.__module__ = 'schema_v4_export'
