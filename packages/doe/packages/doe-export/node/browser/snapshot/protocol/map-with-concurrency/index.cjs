// Origin: browser_snapshot.js::mapWithConcurrency


async function mapWithConcurrency(items, concurrency, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      try {
        results[index] = await callback(items[index], index);
      } catch (error) {
        results[index] = {
          success: false,
          error: error && error.message ? error.message : String(error),
          error_kind: error && error.yrkieErrorKind === "content" ? "content" : "runtime",
          stack: error && error.stack ? String(error.stack) : null,
        };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, worker));
  return results;
}

module.exports = { mapWithConcurrency };
