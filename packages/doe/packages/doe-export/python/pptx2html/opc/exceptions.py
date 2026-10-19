"""OPC-related custom exceptions."""


class OpcError(Exception):
    """Base exception for OPC-related errors."""


class PackageNotFoundError(OpcError):
    """Raised when the package file cannot be found or opened."""


class ContentTypeError(OpcError):
    """Raised when a content type is unknown or invalid."""


class PartNotFoundError(OpcError):
    """Raised when a requested part does not exist in the package."""


class InvalidPackURIError(OpcError):
    """Raised when a PackURI string is invalid."""
