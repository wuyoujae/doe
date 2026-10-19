# Origin: pptx2html/ir/builder.py::PresentationBuilder._ctn_start_delay_ms
from __future__ import annotations
from doe_export.ir.importer.shared import ET, NAMESPACE, Optional

def _ctn_start_delay_ms(self, c_tn: Optional[ET.Element]) -> int:
    if c_tn is None:
        return 0
    _P = NAMESPACE.PML_MAIN
    delays = [
        self._duration_ms(cond.get("delay"))
        for cond in c_tn.findall(f"{{{_P}}}stCondLst/{{{_P}}}cond")
        if cond.get("delay") not in {None, "", "indefinite"}
    ]
    delays = [delay for delay in delays if delay is not None]
    return min(delays) if delays else 0

_ctn_start_delay_ms.__module__ = 'pptx2html.ir.builder'
_ctn_start_delay_ms.__qualname__ = 'PresentationBuilder._ctn_start_delay_ms'
