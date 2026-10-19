"""OPC (Open Packaging Convention) reader for pptx2html.

Provides the low-level infrastructure to open ``.pptx`` files, navigate
their part/relationship graph, and access part content.
"""

from .constants import NAMESPACE, RELATIONSHIP_TYPE, CONTENT_TYPE, TARGET_MODE
from .exceptions import (
    OpcError,
    PackageNotFoundError,
    ContentTypeError,
    PartNotFoundError,
    InvalidPackURIError,
)
from .packuri import PackURI, PACKAGE_URI, CONTENT_TYPES_URI
from .package import OpcPackage
from .part import Part, XmlPart, PartFactory
from .rels import Relationship, Relationships

__all__ = [
    # Main entry
    "OpcPackage",
    # Value types
    "PackURI",
    "PACKAGE_URI",
    "CONTENT_TYPES_URI",
    "Part",
    "XmlPart",
    "PartFactory",
    "Relationship",
    "Relationships",
    # Constants
    "NAMESPACE",
    "RELATIONSHIP_TYPE",
    "CONTENT_TYPE",
    "TARGET_MODE",
    # Exceptions
    "OpcError",
    "PackageNotFoundError",
    "ContentTypeError",
    "PartNotFoundError",
    "InvalidPackURIError",
]
