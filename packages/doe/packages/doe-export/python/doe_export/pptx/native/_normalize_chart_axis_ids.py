# Origin: schema_v4_native.py::_normalize_chart_axis_ids
from __future__ import annotations
from .shared import BytesIO, ZIP_DEFLATED, ZipFile, _CHART_AXIS_ID

def _normalize_chart_axis_ids(pptx_bytes: bytes) -> bytes:
    source = BytesIO(pptx_bytes)
    target = BytesIO()
    with ZipFile(source, "r") as package, ZipFile(target, "w", ZIP_DEFLATED) as output:
        for item in package.infolist():
            payload = package.read(item.filename)
            if item.filename.startswith("ppt/charts/chart") and item.filename.endswith(".xml"):
                # Office rejects some uint32 IDs above INT32_MAX even though
                # ChartML permits them. Preserve references using small local IDs.
                axis_ids = {}
                for match in _CHART_AXIS_ID.finditer(payload):
                    axis_ids.setdefault(match.group(2), str(len(axis_ids) + 1).encode("ascii"))
                payload = _CHART_AXIS_ID.sub(
                    lambda match: (
                        match.group(1)
                        + axis_ids[match.group(2)]
                        + match.group(3)
                    ),
                    payload,
                )
            output.writestr(item, payload)
    return target.getvalue()

_normalize_chart_axis_ids.__module__ = 'schema_v4_native'
