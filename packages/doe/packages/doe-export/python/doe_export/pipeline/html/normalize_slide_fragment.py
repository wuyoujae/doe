# Origin: pptx_pipeline.py::normalize_slide_fragment
from __future__ import annotations
from doe_export.pipeline.shared import SLIDE_ROOT_TAGS, recover_serialized_html_source
from doe_export.pipeline.text_layout._SlideDocumentExtractor import _SlideDocumentExtractor
from doe_export.pipeline.validation._SlideFragmentValidator import _SlideFragmentValidator

def normalize_slide_fragment(fragment: str) -> str:
    if not isinstance(fragment, str) or not fragment.strip():
        raise ValueError("Slide fragment is required.")
    normalized = recover_serialized_html_source(fragment).strip()
    document = _SlideDocumentExtractor(normalized)
    document.feed(normalized)
    document.close()
    if document.is_document:
        normalized = document.extract_body()
    validator = _SlideFragmentValidator()
    validator.feed(normalized)
    validator.close()
    if validator.depth != 0:
        validator.errors.append("Slide fragment contains unbalanced HTML tags.")
    if validator.root_count != 1 or validator.root_tag not in SLIDE_ROOT_TAGS:
        validator.errors.append(
            "Slide fragment must contain exactly one root slide container "
            "(<div> or <section>)."
        )
    if validator.errors:
        raise ValueError(" ".join(dict.fromkeys(validator.errors)))
    return normalized

normalize_slide_fragment.__module__ = 'pptx_pipeline'
