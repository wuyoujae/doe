# Origin: pptx2html/server/ooxml_pptx_writer.py::find_matching_original_shape
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shape.shape_identity import shape_identity
from doe_export.pptx.ooxml.shape.shape_type_identity import shape_type_identity

def find_matching_original_shape(
    shape: dict[str, Any],
    original_shapes: list[dict[str, Any]],
    used_indexes: set[int],
    *,
    preferred_index: int | None = None,
) -> int | None:
    for index, original in enumerate(original_shapes):
        if index in used_indexes:
            continue
        if shape_identity(shape) == shape_identity(original):
            return index

    shape_id = shape.get("shape_id")
    if isinstance(shape_id, int):
        id_matches = [
            index
            for index, original in enumerate(original_shapes)
            if index not in used_indexes
            and original.get("shape_id") == shape_id
            and shape_type_identity(shape) == shape_type_identity(original)
        ]
        if len(id_matches) == 1:
            return id_matches[0]

    # Some recovered group children have no cNvPr id. Their recursive IR path
    # remains stable across Canvas edits, so use it only when it cannot
    # override conflicting explicit ids and the element kind still matches.
    if preferred_index is not None and 0 <= preferred_index < len(original_shapes):
        original = original_shapes[preferred_index]
        original_id = original.get("shape_id")
        if (
            preferred_index not in used_indexes
            and shape_type_identity(shape) == shape_type_identity(original)
            and not (isinstance(shape_id, int) and isinstance(original_id, int) and shape_id != original_id)
        ):
            return preferred_index
    return None

find_matching_original_shape.__module__ = 'pptx2html.server.ooxml_pptx_writer'
