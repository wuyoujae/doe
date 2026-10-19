# Origin: pptx_pipeline.py::_validate_pptx_package
from __future__ import annotations
from doe_export.pipeline.shared import BytesIO, validate_pptx_archive, zipfile

def _validate_pptx_package(pptx_bytes: bytes) -> None:
    try:
        with zipfile.ZipFile(BytesIO(pptx_bytes)) as package:
            validate_pptx_archive(package)
    except zipfile.BadZipFile as error:
        raise ValueError("The uploaded file is not a valid PPTX ZIP package.") from error

_validate_pptx_package.__module__ = 'pptx_pipeline'
