# Origin: schema_v4_math.py::_office_xslt_path
from __future__ import annotations
from .shared import Path, os

def _office_xslt_path() -> Path | None:
    for candidate in (
        os.environ.get("MML2OMML_XSL"),
        r"C:\Program Files\Microsoft Office\root\Office16\MML2OMML.XSL",
        r"C:\Program Files (x86)\Microsoft Office\root\Office16\MML2OMML.XSL",
        r"C:\Program Files\Microsoft Office\Office16\MML2OMML.XSL",
        r"C:\Program Files (x86)\Microsoft Office\Office16\MML2OMML.XSL",
    ):
        if candidate and Path(candidate).is_file():
            return Path(candidate)
    return None

_office_xslt_path.__module__ = 'schema_v4_math'
