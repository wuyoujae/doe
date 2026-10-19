// Origin: browser_snapshot.js::runWorker
const { readline } = require("../../environment/index.cjs");
const { launchBrowser } = require("../../browser/launch-browser/index.cjs");
const { handlePayload } = require("../handle-payload/index.cjs");
const { errorPayload } = require("../error-payload/index.cjs");

async function runWorker() {
  const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  let browser = null;
  try {
    for await (const line of input) {
      if (!line.trim()) continue;
      let requestId = null;
      let result;
      try {
        const request = JSON.parse(line);
        requestId = request.request_id ?? null;
        if (!browser) browser = await launchBrowser();
        result = await handlePayload(browser, request.payload || {});
      } catch (error) {
        result = errorPayload(error);
      }
      process.stdout.write(`${JSON.stringify({ request_id: requestId, result })}\n`);
    }
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { runWorker };
