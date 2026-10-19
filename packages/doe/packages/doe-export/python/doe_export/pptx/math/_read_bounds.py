# Origin: schema_v4_math.py::_read_bounds
from __future__ import annotations

def _read_bounds(value: object) -> tuple[float, float, float, float]:
    if not isinstance(value, dict):
        raise ValueError("Native formula bounds_pt must be an object.")
    try:
        bounds = tuple(float(value[name]) for name in ("left", "top", "width", "height"))
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError(
            "Native formula bounds_pt must contain numeric left/top/width/height."
        ) from error
    if bounds[2] <= 0 or bounds[3] <= 0:
        raise ValueError("Native formula width and height must be positive.")
    return bounds  # type: ignore[return-value]

_read_bounds.__module__ = 'schema_v4_math'
