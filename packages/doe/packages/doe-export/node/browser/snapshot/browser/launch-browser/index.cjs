// Origin: browser_snapshot.js::launchBrowser
const { findBrowserExecutable } = require("../find-browser-executable/index.cjs");
const { chromium } = require("../../environment/index.cjs");

async function launchBrowser() {
  const launchOptions = { headless: true };
  if (/^(1|true|yes)$/i.test(String(process.env.YRKIE_HTMLIR_CHROMIUM_SANDBOX_REQUIRED || ""))) {
    launchOptions.chromiumSandbox = true;
  }
  const executablePath = findBrowserExecutable();
  if (executablePath) launchOptions.executablePath = executablePath;
  return chromium.launch(launchOptions);
}

module.exports = { launchBrowser };
