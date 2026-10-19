// Origin: browser_snapshot.js::handlePayload
const { renderPdf } = require("../../capture/render-pdf/index.cjs");
const { mapWithConcurrency } = require("../map-with-concurrency/index.cjs");
const { renderSnapshot } = require("../../capture/render-snapshot/index.cjs");

async function handlePayload(browser, payload) {
  if (payload.command === "ping") {
    return { success: true, ready: true };
  }
  if (payload.command === "pdf") {
    return renderPdf(browser, payload);
  }
  if (Array.isArray(payload.items)) {
    const common = { ...payload };
    delete common.items;
    const concurrency = Math.max(1, Math.min(Number(payload.concurrency) || 2, 4));
    const results = await mapWithConcurrency(payload.items, concurrency, async (item) => ({
      id: item.id,
      ...(await renderSnapshot(browser, { ...common, ...item })),
    }));
    return { success: true, results };
  }
  return renderSnapshot(browser, payload);
}

module.exports = { handlePayload };
