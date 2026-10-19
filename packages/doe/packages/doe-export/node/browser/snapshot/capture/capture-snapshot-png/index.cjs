// Origin: browser_snapshot.js::captureSnapshotPng
const { remainingExportTime } = require("../../assets/remaining-export-time/index.cjs");
const { invalidInputError } = require("../../validation/invalid-input-error/index.cjs");

async function captureSnapshotPng(page, payload, deadline, phase) {
  const options = {
    type: "png",
    animations: "disabled",
    omitBackground: Boolean(payload.omit_background),
    timeout: remainingExportTime(deadline, phase),
  };
  const selector = typeof payload.screenshot_selector === "string"
    ? payload.screenshot_selector.trim()
    : "";
  if (!selector) {
    return page.screenshot({ ...options, fullPage: false });
  }

  const target = page.locator(selector).first();
  if (await target.count() === 0) {
    throw invalidInputError(`Screenshot target was not found: ${selector}`);
  }
  return target.screenshot(options);
}

module.exports = { captureSnapshotPng };
