import { parse as __doeFn_parse } from '../../parse/index.js';
import { diagnose as __doeFn_diagnose } from '../../diagnose/index.js';
import { scanStructure as __doeFn_scanStructure } from '../../scan-structure/index.js';
import { formatDiagnostic as __doeFn_formatDiagnostic } from '../../format-diagnostic/index.js';
import { formatRepair as __doeFn_formatRepair } from '../../format-repair/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:1048
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.global.SchemaJsonRecovery = Object.freeze({
    parse: __doeFn_parse,
    diagnose: __doeFn_diagnose,
    scanStructure: __doeFn_scanStructure,
    formatDiagnostic: __doeFn_formatDiagnostic,
    formatRepair: __doeFn_formatRepair,
  });
}
