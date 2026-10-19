import { solveLocalFlowLayout } from './solve.js';
import { normalizeCompression } from './policy.js';
import { applyFlowDensity } from '../apply.js';
import { scope } from '../../../runtime/context/index.js';

/** Draft geometry uses the real solver without replacing the active editable DOM. */
export function createFlowTextPreview(state) {
  let frame = 0, active = null;
  return function preview(action, session, draft) {
    if (state.flowLayout?.compression === 'page-v1') return;
    if (action === 'start') {
      active = session;
      return;
    }
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (action === 'finish') {
      active = null;
      state.flowPreview = false;
      state.flowChanges = [];
      state.flowChanged = false;
      state.flowCompression = normalizeCompression(state.slide.layout.compression);
      applyFlowDensity(state, scope.DENSITIES[0]);
      return;
    }
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (active !== session || session.finished || state.disposed || state.signal?.aborted) return;
      const props = session.node.props;
      const layout = structuredClone(state.slide.layout);
      const path = session.contract.path;
      session.node.props = structuredClone(props);
      scope.global.DOETextFields.write(session.node.props, path, draft);
      state.flowChanges = [{id:session.node.id, paths:[path]}];
      state.flowChanged = true;
      state.flowPreview = true;
      try {
        const report = solveLocalFlowLayout(state);
        session.previewReport = report;
        session.showPreview?.(report);
      } finally {
        // Preview never mutates the document or records an undo entry.
        session.node.props = props;
        state.slide.layout = layout;
        state.flowPreview = false;
        state.flowChanges = [];
        state.flowChanged = false;
      }
    });
  };
}
