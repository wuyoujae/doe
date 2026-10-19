// Keep the last committed DOM painted while asynchronous layout measures its
// replacement. Both roots share the same host geometry; only the candidate is
// transparent. A transaction can span several rebuilds, including rollback.
const buffers = new WeakMap();
const renderFields = ['slideElement', 'layoutElement', 'backgroundView', 'leafRecords',
  'groupRecords', 'siblingSets', 'rootShells', 'solverItemColumnCandidates', 'questionCardSequence', 'report', 'renderEpoch'];

function disposeCharts(element) {
  element?.querySelectorAll('[data-chart-runtime]').forEach(root => root.__disposeChartInteraction?.());
}

export function stageRender(state, element) {
  const buffer = buffers.get(state);
  if (!buffer) { state.host.replaceChildren(element); return; }
  if (buffer.candidate) { disposeCharts(buffer.candidate); buffer.candidate.remove(); }
  buffer.candidate = element;
  buffer.opacity = element.style.opacity;
  buffer.inert = element.inert;
  element.style.opacity = '0';
  element.inert = true;
  state.host.append(element);
}

export function commitRender(state) {
  const buffer = buffers.get(state);
  if (!buffer?.candidate) return;
  const candidate = buffer.candidate;
  candidate.style.opacity = buffer.opacity;
  candidate.inert = buffer.inert;
  disposeCharts(buffer.previous);
  buffer.previous.remove();
  buffer.previous = candidate;
  buffer.previousInert = candidate.inert;
  buffer.candidate = null;
  buffer.committed = true;
}

export async function withRenderBuffer(state, render) {
  if (buffers.has(state) || !state.slideElement?.isConnected || !state.host.contains(state.slideElement)) return render();
  const previous = state.slideElement;
  const snapshot = Object.fromEntries(renderFields.map(key => [key, state[key]]));
  const resultSnapshot = state.result && { element: state.result.element, layoutElement: state.result.layoutElement,
    report: state.result.report, renderEpoch: state.result.renderEpoch };
  const buffer = { previous, previousInert: previous.inert, candidate: null };
  buffers.set(state, buffer);
  previous.inert = true;
  try {
    const result = await render();
    if (!state.disposed && !state.signal?.aborted) commitRender(state);
    return result;
  } finally {
    if (buffer.candidate) {
      disposeCharts(buffer.candidate);
      buffer.candidate.remove();
    }
    if (!buffer.committed) {
      Object.assign(state, snapshot);
      if (resultSnapshot) Object.assign(state.result, resultSnapshot);
    }
    buffer.previous.inert = buffer.previousInert;
    buffers.delete(state);
  }
}
