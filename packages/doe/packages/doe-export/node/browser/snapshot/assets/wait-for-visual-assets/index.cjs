// Origin: browser_snapshot.js::waitForVisualAssets
const { waitForVisualAssetsInPage1 } = require("../../page/wait-for-visual-assets-in-page1/index.cjs");

async function waitForVisualAssets(
  page,
  timeoutMs,
  {
    failOnError = true,
    maxAssets = 10000,
    concurrency = 8,
    sourceGraceMs = 5000,
  } = {},
) {
  const report = await page.evaluate(waitForVisualAssetsInPage1, {
    budgetMs: Math.max(1, Math.floor(timeoutMs)),
    assetLimit: Math.max(1, Math.floor(maxAssets)),
    workerLimit: Math.max(1, Math.floor(concurrency)),
    sourceWaitMs: Math.max(100, Math.floor(sourceGraceMs)),
  });

  if (!report.ok && failOnError) {
    const details = report.failures
      .map((failure) => `${failure.kind} ${failure.source}: ${failure.reason}`)
      .join("; ");
    throw new Error(`Export visual assets are not ready. ${details}`);
  }
  return report;
}

module.exports = { waitForVisualAssets };
