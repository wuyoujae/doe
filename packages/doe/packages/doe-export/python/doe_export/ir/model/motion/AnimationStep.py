from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity


@dataclass
@preserve_identity
class AnimationStep:
    """A first-pass flattened slide timing behavior."""

    kind: str = ""
    order: int = 0
    target_shape_id: Optional[int] = None
    start_ms: Optional[int] = None
    click_index: Optional[int] = None
    group_id: Optional[str] = None
    node_type: Optional[str] = None
    preset_id: Optional[str] = None
    preset_class: Optional[str] = None
    preset_subtype: Optional[str] = None
    transition: Optional[str] = None
    filter: Optional[str] = None
    duration_ms: Optional[int] = None
    delay_ms: Optional[int] = None
    trigger: Optional[str] = None
    fill: Optional[str] = None
    attr_names: list[str] = field(default_factory=list)
    from_value: Optional[str] = None
    to_value: Optional[str] = None
    motion_path: Optional[str] = None
    motion_dx: Optional[float] = None
    motion_dy: Optional[float] = None
    scale_x: Optional[float] = None
    scale_y: Optional[float] = None
    raw_attrs: dict[str, str] = field(default_factory=dict)
