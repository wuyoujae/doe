"""Presentation — the top-level API for opening and working with .pptx files.

Usage::

    from pptx2html import Presentation

    with Presentation.open("deck.pptx") as prs:
        print(f"Slides: {len(prs.slides)}")
        for slide in prs.slides:
            for shape in slide.shapes:
                if shape.has_text_frame:
                    print(shape.text_frame.text)
"""

from typing import IO, Optional, Union

from pptx2html.opc.package import OpcPackage
from pptx2html.opc.constants import CONTENT_TYPE
from .parts import PresentationPart, SlidePart, SlideLayoutPart, SlideMasterPart


class Presentation:
    """A PowerPoint presentation.

    The primary entry point for the pptx2html library.  Opens a
    ``.pptx`` file and provides access to slides, layouts, masters,
    and presentation-level properties.

    Usage::

        prs = Presentation.open("deck.pptx")
        # or use as context manager:
        with Presentation.open("deck.pptx") as prs:
            for slide in prs.slides:
                ...
    """

    def __init__(self, package: OpcPackage, presentation_part: PresentationPart):
        self._package = package
        self._part = presentation_part

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @classmethod
    def open(
        cls,
        path_or_stream: Union[str, bytes, IO[bytes]],
    ) -> "Presentation":
        """Open a ``.pptx`` file and return a ``Presentation`` instance.

        Args:
            path_or_stream: File path string, bytes path, or a binary stream.

        Returns:
            A new ``Presentation`` instance.
        """
        package = OpcPackage.open(path_or_stream)
        presentation_part = package.main_document_part
        # The PartFactory should have created a PresentationPart,
        # but just in case, wrap a plain Part:
        if not isinstance(presentation_part, PresentationPart):
            # Fallback: create a PresentationPart wrapper
            presentation_part = PresentationPart(
                presentation_part.pack_uri,
                presentation_part.content_type,
                presentation_part.blob,
                package,
            )
        return cls(package, presentation_part)

    @property
    def slides(self) -> list[SlidePart]:
        """All slides in the presentation (list of ``SlidePart``)."""
        return self._part.slides

    @property
    def slide_width(self) -> Optional[float]:
        """Slide width in points."""
        return self._part.slide_width

    @property
    def slide_height(self) -> Optional[float]:
        """Slide height in points."""
        return self._part.slide_height

    @property
    def slide_layouts(self) -> list[SlideLayoutPart]:
        """Unique slide layouts used by slides."""
        return self._part.slide_layouts

    @property
    def slide_masters(self) -> list[SlideMasterPart]:
        """Slide masters."""
        return self._part.slide_masters

    @property
    def presentation_part(self) -> PresentationPart:
        """The underlying ``PresentationPart``."""
        return self._part

    def close(self) -> None:
        """Close the underlying package reader."""
        self._package.close()

    # ------------------------------------------------------------------
    # Context manager
    # ------------------------------------------------------------------

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False

    def __repr__(self) -> str:
        return (
            f"Presentation(slides={len(self.slides)}, "
            f"size={self.slide_width}x{self.slide_height})"
        )
