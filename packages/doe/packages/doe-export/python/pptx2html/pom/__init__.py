"""POM (Presentation Object Model) layer for pptx2html.

This package sits on top of the ``opc`` package and provides
domain objects for working with PowerPoint presentations:
slides, shapes, text, and formatting.
"""

# Import parts first to trigger PartFactory registration
from . import parts as _parts  # noqa: F401 — side-effect: PartFactory registration
from .presentation import Presentation

__all__ = [
    "Presentation",
]
