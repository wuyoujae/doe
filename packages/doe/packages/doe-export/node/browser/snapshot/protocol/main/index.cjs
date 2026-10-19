// Origin: browser_snapshot.js::main
const { runWorker } = require("../run-worker/index.cjs");
const { readStdin } = require("../read-stdin/index.cjs");
const { launchBrowser } = require("../../browser/launch-browser/index.cjs");
const { handlePayload } = require("../handle-payload/index.cjs");

async function main() {
  if (process.argv.includes("--worker")) {
    await runWorker();
    return;
  }

  const raw = await readStdin();
  const payload = raw.trim() ? JSON.parse(raw) : {};
  const browser = await launchBrowser();
  try {
    process.stdout.write(JSON.stringify(await handlePayload(browser, payload)));
  } finally {
    await browser.close();
  }
}

module.exports = { main };
