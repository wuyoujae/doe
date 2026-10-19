"""Small JSON/dict hydration helpers for IR dataclasses."""

from __future__ import annotations

import types
from dataclasses import fields, is_dataclass
from typing import Any, TypeVar, Union, get_args, get_origin, get_type_hints

from .model import Presentation


T = TypeVar("T")


def dataclass_from_dict(cls: type[T], value: Any) -> T:
    """Hydrate *cls* recursively from a JSON-compatible value.

    Unknown keys are intentionally ignored so WebUI metadata can evolve without
    breaking server-side render/export endpoints. Missing keys use dataclass
    defaults.
    """

    converted = _convert_value(cls, value)
    if not isinstance(converted, cls):
        raise TypeError(f"Expected {cls.__name__} object")
    return converted


def presentation_from_dict(value: Any) -> Presentation:
    return dataclass_from_dict(Presentation, value)


def _convert_value(annotation: Any, value: Any) -> Any:
    if annotation is Any or annotation is None:
        return value
    if value is None:
        return None

    origin = get_origin(annotation)
    args = get_args(annotation)

    if origin in {list, tuple, set}:
        item_type = args[0] if args else Any
        items = [_convert_value(item_type, item) for item in value]
        if origin is tuple:
            return tuple(items)
        if origin is set:
            return set(items)
        return items

    if origin is dict:
        key_type = args[0] if args else Any
        value_type = args[1] if len(args) > 1 else Any
        return {
            _convert_value(key_type, key): _convert_value(value_type, item)
            for key, item in value.items()
        }

    if origin in {Union, types.UnionType}:
        options = [option for option in args if option is not type(None)]
        for option in options:
            try:
                return _convert_value(option, value)
            except (TypeError, ValueError):
                continue
        return value

    if isinstance(annotation, type) and is_dataclass(annotation):
        if isinstance(value, annotation):
            return value
        if not isinstance(value, dict):
            raise TypeError(f"Expected object for {annotation.__name__}")
        hints = get_type_hints(annotation)
        kwargs = {}
        for field in fields(annotation):
            if field.name not in value:
                continue
            kwargs[field.name] = _convert_value(hints.get(field.name, Any), value[field.name])
        return annotation(**kwargs)

    if annotation in {str, int, float, bool}:
        if isinstance(value, annotation):
            return value
        return annotation(value)

    return value

