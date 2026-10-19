"""Small XML helpers for OOXML namespaced elements."""


def qn(namespace: str, tag: str) -> str:
    """Return an ElementTree qualified name for *namespace* and *tag*."""
    return f"{{{namespace}}}{tag}"


def local_name(tag: str) -> str:
    """Return the local part of an ElementTree tag."""
    if tag.startswith("{"):
        return tag.rsplit("}", 1)[1]
    return tag
