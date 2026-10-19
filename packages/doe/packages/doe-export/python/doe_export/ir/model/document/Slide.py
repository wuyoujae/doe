from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.motion.AnimationStep import AnimationStep
from doe_export.ir.model.paint.Background import Background
from doe_export.ir.model.shape.Shape import Shape
from doe_export.ir.model.motion.SlideTransition import SlideTransition

@dataclass
@preserve_identity
class Slide:
    """A single slide."""

    index: int = 0
    name: Optional[str] = None
    show: bool = True
    background: Optional[Background] = None
    shapes: list[Shape] = field(default_factory=list)
    transition: Optional[SlideTransition] = None
    animations: list[AnimationStep] = field(default_factory=list)
