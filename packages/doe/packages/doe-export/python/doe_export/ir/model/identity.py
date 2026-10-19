"""Keep existing dataclass, generated-method and pickle identities after relocation."""
from types import FunctionType


def preserve_identity(cls):
    cls.__module__ = "pptx2html.ir.model"
    for value in vars(cls).values():
        if isinstance(value, FunctionType):
            value.__module__ = cls.__module__
        elif isinstance(value, property):
            for function in (value.fget, value.fset, value.fdel):
                if function is not None:
                    function.__module__ = cls.__module__
    return cls
