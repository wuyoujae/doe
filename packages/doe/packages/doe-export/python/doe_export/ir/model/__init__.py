"""Preserved DOE export intermediate representation data."""

from importlib import import_module as _import_module

# Dataclass decorators resolve annotations through the preserved public module.
# Establish that namespace before a private leaf can be imported directly; the
# public module assembles the classes in their original eager declaration order.
_import_module("pptx2html.ir.model")
