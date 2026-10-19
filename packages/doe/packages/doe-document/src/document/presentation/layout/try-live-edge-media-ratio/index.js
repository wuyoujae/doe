import { edgeMediaPosition as __doeFn_edgeMediaPosition } from '../edge-media-position/index.js';
import { normalizeEdgeMediaRatio as __doeFn_normalizeEdgeMediaRatio } from '../../schema/normalize-edge-media-ratio/index.js';
import { beginSolverPass as __doeFn_beginSolverPass } from '../begin-solver-pass/index.js';
import { solveLayout as __doeFn_solveLayout } from '../solve-layout/index.js';
import { syncLiveEdgeReport as __doeFn_syncLiveEdgeReport } from '../sync-live-edge-report/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2550


export function tryLiveEdgeMediaRatio(state, node, ratio, restoreRatio) {
    const position = (0, __doeFn_edgeMediaPosition)(node);
    node.layout.mediaRatio =
      Math.round((0, __doeFn_normalizeEdgeMediaRatio)(ratio, position) * 1000) / 1000;
    (0, __doeFn_beginSolverPass)(state);
    const candidateReport = (0, __doeFn_solveLayout)(state);
    if (candidateReport.fits) {
      return {
        accepted: true,
        ratio: node.layout.mediaRatio,
        report: (0, __doeFn_syncLiveEdgeReport)(state, candidateReport),
      };
    }
    node.layout.mediaRatio = restoreRatio;
    // The rejected candidate may legitimately exhaust its page budget. A
    // rollback is a separate deterministic solve: reusing that exhausted
    // budget would fall through to the preferred (largest) density and leave
    // the restored safe ratio painted as an unsafe layout.
    (0, __doeFn_beginSolverPass)(state);
    const restoredReport = (0, __doeFn_solveLayout)(state);
    return {
      accepted: false,
      ratio: restoreRatio,
      rejectedReport: candidateReport,
      report: (0, __doeFn_syncLiveEdgeReport)(state, restoredReport),
    };
  }
