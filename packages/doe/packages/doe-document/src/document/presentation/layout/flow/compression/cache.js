import { normalizeCompression } from './policy.js';

const plans = new Map(), maximumPlans = 128;
let fontGeneration = 0;
globalThis.document?.fonts?.addEventListener('loadingdone', () => { fontGeneration += 1; plans.clear(); });
export const fontRevision = () => fontGeneration;

/** A bounded, document-local cache of accepted plans; never a cache of author content. */
export function cachedCompression(key) {
  const value = plans.get(key);
  if (!value) return null;
  plans.delete(key); plans.set(key, value);
  return normalizeCompression(value);
}

export function rememberCompression(key, value) {
  plans.delete(key); plans.set(key, normalizeCompression(value));
  if (plans.size > maximumPlans) plans.delete(plans.keys().next().value);
}
