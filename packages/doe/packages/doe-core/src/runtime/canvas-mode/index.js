const modes = new Set(['editable', 'present', 'static']);

/** Mode is runtime policy, never a mutation of the persisted component schema. */
export function resolveCanvasMode(options = {}, fallback = 'editable') {
  const mode = options.mode ?? (typeof options.editable === 'boolean' ? (options.editable ? 'editable' : 'present') : fallback);
  if (!modes.has(mode)) throw new TypeError(`Unknown Canvas mode: ${mode}`);
  return mode;
}

export function applyCanvasMode(element, mode) {
  element.dataset.canvasMode = mode;
  element.inert = mode === 'static';
}
