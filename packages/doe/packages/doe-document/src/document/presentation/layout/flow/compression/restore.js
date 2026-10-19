import { runSteps } from './steps.js';
import { normalizeCompression } from './policy.js';
import { itemTextPeers, continuousTextPeers, stepItemText } from './item-text.js';
import { fitContinuousTextSteps, setItemTextRatio } from './continuous.js';
import { isLayoutFeatureLocked } from '../../is-layout-feature-locked/index.js';
import { isBodyField } from './candidate.js';

/** A naturally larger page heading must not end up smaller than its body. */
export function preserveHeadingHierarchy(state) {
  const fields = state.flowTextTargets || [];
  const bodies = fields.filter(isBodyField);
  const base = Math.max(0, ...bodies.map(field => field.basePt));
  const current = Math.max(0, ...bodies.map(field => field.basePt * (state.flowCompression.textRatio[field.key] ?? 1)));
  for (const field of fields.filter(field => /^H[1-6]$/.test(field.target?.tagName || '') && field.basePt >= base)) {
    setItemTextRatio(state.flowCompression, [field], Math.max(state.flowCompression.textRatio[field.key] ?? 1, current / field.basePt));
  }
}

function* restoreBodyBalanceSteps(state, groups, measure, report) {
  if (groups.length < 2) return;
  const baseline = groups.map(peers => Math.min(...peers.map(field => state.flowCompression.textRatio[field.key] ?? 1)));
  if (baseline.every(ratio => ratio === 1)) return;
  const previous = normalizeCompression(state.flowCompression);
  const apply = ratio => {
    state.flowCompression = normalizeCompression(previous);
    // Maximize the smallest retained ratio first. A group with a higher author
    // floor waits while its neighbors catch up; equal progress from unequal
    // floors would spend scarce height on the already more readable group.
    groups.forEach((peers, index) => setItemTextRatio(state.flowCompression, peers, Math.max(baseline[index], ratio)));
    preserveHeadingHierarchy(state);
    return measure('restore-body-balance');
  };
  if (yield () => apply(1)) return;
  let low = Math.min(...baseline), high = 1;
  const largest = Math.max(...groups.flat().map(field => field.basePt));
  for (let pass = 0; pass < 16 && (high - low) * largest > .01; pass++) {
    const middle = (low + high) / 2;
    if (yield () => apply(middle)) low = middle;
    else high = middle;
  }
  yield () => apply(low);
  if (!report().fits) { state.flowCompression = previous; yield () => measure('restore-body-balance-revert'); }
}

/** Restore external compression first, then restore only the affected text. */
export function restoreCompression(state, order, measure, candidates, report, solveContent = () => false) { return runSteps(restoreCompressionSteps(state, order, measure, candidates, report, function* () { return solveContent(); })); }
export function* restoreCompressionSteps(state, order, measure, candidates, report, solveContent = function* () { return false; }) {
  const rank = new Map(state.flowCompression.order.map((key, index) => [key, index]));
  const rows = [...order].sort((a, b) => (rank.get(a.units[0].key) ?? Infinity) - (rank.get(b.units[0].key) ?? Infinity));
  yield* restoreComponentCompressionSteps(state, rows, measure, report, solveContent);
  yield* restoreColumnsAndContentSteps(state, rows, measure, candidates, report);
}

export function restoreComponentCompression(state, rows, measure, report, solveContent = () => false) { return runSteps(restoreComponentCompressionSteps(state, rows, measure, report, function* () { return solveContent(); })); }
export function* restoreComponentCompressionSteps(state, rows, measure, report, solveContent) {
  for (const row of rows) {
    const { key } = row.units[0];
    while (state.flowCompression.factor[key]) {
      const saved = normalizeCompression(state.flowCompression);
      const next = Math.round(state.flowCompression.factor[key] * 10) - 1;
      if (next <= 10) delete state.flowCompression.factor[key];
      else state.flowCompression.factor[key] = next / 10;
      const fits = (yield () => measure('restore-component', row));
      if (!fits && !((yield* solveContent()) && report().fits)) {
        state.flowCompression = saved; (yield () => measure('restore-component-revert', row)); break;
      }
    }
  }
}

function* restoreColumnsAndContentSteps(state, rows, measure, candidates, report) {
  for (const row of rows) {
    const { id, record } = row.units[0];
    if (record?.flowContract?.orientationFallback) continue;
    const current = state.flowCompression.columns[id];
    if (!current || state.flowCompression.orientation[id]) continue;
    // Adaptive compensation can add or remove columns. Restore the author's
    // first choice in either direction instead of assuming restoration adds columns.
    for (const columns of (candidates.get(id) || []).slice(0, 1).filter(n => n !== current)) {
      const saved = normalizeCompression(state.flowCompression), previous = state.autoItemColumns.get(id);
      state.flowCompression.columns[id] = columns; state.autoItemColumns.set(id, columns);
      if (!(yield () => measure('restore-columns', row))) {
        state.flowCompression = saved; state.autoItemColumns.set(id, previous); (yield () => measure('restore-columns-revert', row)); break;
      }
      if (columns === candidates.get(id)[0]) delete state.flowCompression.columns[id];
    }
  }
  for (const key of Object.keys(state.flowCompression.truncate)) {
    delete state.flowCompression.truncate[key];
    if (!(yield () => measure('restore-full-content'))) {
      state.flowCompression.truncate[key] = 1; (yield () => measure('restore-full-content-revert'));
    }
  }
  if (!state.previewEnumTextFit) {
    if (report().fits) yield* restoreContinuousTextSteps(state, rows, measure, report);
    return;
  }
  const visited = new Set();
  for (const key of Object.keys(state.flowCompression.text)) {
    if (visited.has(key)) continue;
    const peers = itemTextPeers(state.flowTextTargets, state.flowTextTargets.find(field => field.key === key));
    peers.forEach(field => visited.add(field.key));
    if (peers.some(field => state.flowCompression.truncate[field.key])) continue;
    while (peers.some(field => state.flowCompression.text[field.key])) {
      const previous = normalizeCompression(state.flowCompression);
      stepItemText(state.flowCompression, peers, -1);
      if (!(yield () => measure('restore-content')) || report().internalPressure.some(p => peers.some(field => field.key === p.key))) {
        state.flowCompression = previous; (yield () => measure('restore-content-revert')); break;
      }
    }
  }
}

/** Reclaim released space only if the complete page still fits. */
export function restoreContinuousText(...args) { return runSteps(restoreContinuousTextSteps(...args)); }
export function* restoreContinuousTextSteps(state, rows, measure, report) {
  if (!report().fits) return;
  for (const key of Object.keys(state.flowCompression.truncate)) {
    delete state.flowCompression.truncate[key];
    if (!(yield () => measure('restore-full-content'))) {
      state.flowCompression.truncate[key] = 1; (yield () => measure('restore-full-content-revert'));
    }
  }
  const groups = [], visited = new Set();
  for (const row of rows) {
    const { id, record } = row.units[0];
    if (record.node.children || isLayoutFeatureLocked(record.node, 'typography')) continue;
    for (const key of Object.keys(state.flowCompression.textRatio).filter(key => JSON.parse(key)[0] === id)) {
      if (visited.has(key)) continue;
      const peers = continuousTextPeers(state.flowTextTargets, state.flowTextTargets.find(field => field.key === key));
      peers.forEach(field => visited.add(field.key));
      if (!peers.length || peers.some(field => field.typographyLocked || state.flowCompression.truncate[field.key])) continue;
      groups.push({ row, peers, body: peers.some(isBodyField) });
    }
  }
  yield* restoreBodyBalanceSteps(state, groups.filter(group => group.body).map(group => group.peers), measure, report);
  for (const { row, peers } of groups.sort((a, b) => Number(b.body) - Number(a.body))) {
      if (peers.every(field => !state.flowCompression.textRatio[field.key])) continue;
      const previous = normalizeCompression(state.flowCompression);
      const minimum = Math.min(...peers.map(field => previous.textRatio[field.key] ?? 1));
      // A completed search is already maximal to 0.01pt. Probe one quantum
      // before repeating a full search; unchanged capacity needs only two measures.
      const probe = Math.min(1, minimum + .01 / Math.max(...peers.map(field => field.basePt)));
      setItemTextRatio(state.flowCompression, peers, probe);
      preserveHeadingHierarchy(state);
      if (!(yield () => measure('restore-content-probe', row))) {
        state.flowCompression = previous; yield () => measure('restore-content-revert', row);
        continue;
      }
      const outcome = yield* fitContinuousTextSteps(peers, 1, ratio => {
        state.flowCompression = normalizeCompression(previous);
        setItemTextRatio(state.flowCompression, peers, ratio);
        preserveHeadingHierarchy(state);
        measure('restore-content-continuous', row);
        return report().fits;
      }, probe);
      if (!outcome.fits) {
        state.flowCompression = previous; (yield () => measure('restore-content-revert', row));
      }
  }
}
