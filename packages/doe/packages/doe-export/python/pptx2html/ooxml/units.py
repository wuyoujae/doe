"""OOXML unit conversion helpers."""

from typing import Optional


EMU_PER_INCH = 914400
EMU_PER_POINT = 12700


def emu_to_pt(value: int | str | None) -> Optional[float]:
    """Convert an EMU value to points."""
    if value is None:
        return None
    try:
        return int(value) / EMU_PER_POINT
    except (TypeError, ValueError):
        return None


def percentage_to_float(value: int | str | None) -> Optional[float]:
    """Convert an OOXML ST_Percentage value to a 0-1 float.

    DrawingML percentage attributes commonly use ``100000`` for 100%.
    """
    if value is None:
        return None
    try:
        return int(value) / 100000.0
    except (TypeError, ValueError):
        return None
