# Portions adapted from python-pptx v1.0.2 (MIT).
# Copyright (c) 2013 Steve Canny, https://github.com/scanny
# See licenses/python-pptx-MIT.txt and the export module README.
"""Base proxy classes for the POM layer.

Provides ElementProxy, ParentedElementProxy, and PartElementProxy —
thin wrappers around XML elements that give access to the part
and parent hierarchy.
"""

import xml.etree.ElementTree as ET
from typing import TYPE_CHECKING, Optional, TypeVar

if TYPE_CHECKING:
    from .parts import PmlPart

T = TypeVar("T", bound="ElementProxy")


class ElementProxy:
    """Wraps an ``xml.etree.ElementTree.Element``.

    Subclasses provide domain-specific properties that read from
    the underlying XML element.
    """

    def __init__(self, element: ET.Element):
        self._element = element

    @property
    def element(self) -> ET.Element:
        return self._element

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, self.__class__):
            return NotImplemented
        return self._element is other._element

    def __hash__(self) -> int:
        return id(self._element)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(tag={self._element.tag!r})"


class ParentedElementProxy(ElementProxy):
    """An ElementProxy that knows its parent proxy object."""

    def __init__(self, element: ET.Element, parent: ElementProxy):
        super().__init__(element)
        self._parent = parent

    @property
    def parent(self):
        return self._parent

    @property
    def part(self) -> Optional["PmlPart"]:
        """Walk up the parent chain to find the owning PmlPart."""
        if hasattr(self._parent, "part"):
            return self._parent.part
        return None


class PartElementProxy(ElementProxy):
    """An ElementProxy that knows the part it belongs to."""

    def __init__(self, element: ET.Element, part: "PmlPart"):
        super().__init__(element)
        self._part = part

    @property
    def part(self) -> "PmlPart":
        return self._part
