/** The same measurements run synchronously for live editing, or cooperatively on mount. */
export function runSteps(iterator) {
  try {
    let step = iterator.next();
    while (!step.done) step = iterator.next(step.value());
    return step.value;
  } finally { iterator.return?.(); }
}

export async function runStepsAsync(iterator, { checkpoint = () => {}, pause = () => new Promise(resolve => setTimeout(resolve, 0)), sliceMs = 12 } = {}) {
  let started = performance.now(), step;
  try {
    checkpoint();
    step = iterator.next();
    while (!step.done) {
      if (performance.now() - started >= sliceMs) {
        await pause();
        started = performance.now();
      }
      checkpoint();
      step = iterator.next(step.value());
    }
    return step.value;
  } finally { iterator.return?.(); }
}
