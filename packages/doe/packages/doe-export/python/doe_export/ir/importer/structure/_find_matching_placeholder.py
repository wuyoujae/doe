# Origin: pptx2html/ir/builder.py::PresentationBuilder._find_matching_placeholder
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, BaseSlidePart, Optional

@staticmethod
def _find_matching_placeholder(
    part: BaseSlidePart, ph_type: str, ph_idx: int
) -> Optional[BaseShape]:
    placeholders = list(getattr(part, "placeholders", []))
    if not placeholders:
        return None

    for candidate in placeholders:
        candidate_ph = candidate.placeholder_shape
        if (
            candidate_ph is not None
            and candidate_ph.idx == ph_idx
            and candidate_ph.type == ph_type
        ):
            return candidate

    if ph_idx != 0:
        for candidate in placeholders:
            candidate_ph = candidate.placeholder_shape
            if candidate_ph is not None and candidate_ph.idx == ph_idx:
                return candidate

    for candidate in placeholders:
        candidate_ph = candidate.placeholder_shape
        if candidate_ph is not None and candidate_ph.type == ph_type:
            return candidate

    for candidate in placeholders:
        candidate_ph = candidate.placeholder_shape
        if candidate_ph is not None and candidate_ph.idx == ph_idx:
            return candidate

    return None

_find_matching_placeholder.__func__.__module__ = 'pptx2html.ir.builder'
_find_matching_placeholder.__func__.__qualname__ = 'PresentationBuilder._find_matching_placeholder'
