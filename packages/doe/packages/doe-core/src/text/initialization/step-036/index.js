import { applyElement as __doeFn_applyElement } from '../../apply-element/index.js';
import { applyTree as __doeFn_applyTree } from '../../apply-tree/index.js';
import { layout as __doeFn_layout } from '../../layout/index.js';
import { editingText as __doeFn_editingText } from '../../editing-text/index.js';
import { bindEditingHistory as __doeFn_bindEditingHistory } from '../../bind-editing-history/index.js';
import { insertEditingText as __doeFn_insertEditingText } from '../../insert-editing-text/index.js';
import { refreshEditing as __doeFn_refreshEditing } from '../../refresh-editing/index.js';
import { projectLines as __doeFn_projectLines } from '../../project-lines/index.js';
import { normalizeLocale as __doeFn_normalizeLocale } from '../../normalize-locale/index.js';
import { prepareElement as __doeFn_prepareElement } from '../../prepare-element/index.js';
import { solveLines as __doeFn_solveLines } from '../../solve-lines/index.js';
import { tokenize as __doeFn_tokenize } from '../../tokenize/index.js';
import { createMeasure } from '../../create-measure/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:762
import { scope as __doeScope } from "../../layout/runtime/context/index.js";

export function initialize() {
__doeScope.global.SemanticTextLayout = Object.freeze({
    DEFAULT_TERMS: __doeScope.DEFAULT_TERMS,
    PT_TO_PX: __doeScope.PT_TO_PX,
    applyElement: __doeFn_applyElement,
    applyTree: __doeFn_applyTree,
    layout: __doeFn_layout,
    editingText: __doeFn_editingText,
    bindEditingHistory: __doeFn_bindEditingHistory,
    insertEditingText: __doeFn_insertEditingText,
    refreshEditing: __doeFn_refreshEditing,
    projectLines: __doeFn_projectLines,
    normalizeLocale: __doeFn_normalizeLocale,
    prepareElement: __doeFn_prepareElement,
    solveLines: __doeFn_solveLines,
    tokenize: __doeFn_tokenize,
    createMeasure,
  });
}
