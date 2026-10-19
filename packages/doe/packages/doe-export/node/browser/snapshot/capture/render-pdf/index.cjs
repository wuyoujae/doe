// Origin: browser_snapshot.js::renderPdf
const { assertSafeMarkupSource } = require("../../validation/assert-safe-markup-source/index.cjs");
const { securePageNetwork } = require("../../validation/secure-page-network/index.cjs");
const { injectStaticContentSecurityPolicy } = require("../../validation/inject-static-content-security-policy/index.cjs");
const { injectExportStabilityStyles } = require("../../html/inject-export-stability-styles/index.cjs");
const { remainingExportTime } = require("../../assets/remaining-export-time/index.cjs");
const { assertStaticDocument } = require("../../validation/assert-static-document/index.cjs");
const { waitForVisualAssets } = require("../../assets/wait-for-visual-assets/index.cjs");

async function renderPdf(browser, payload) {
  const source = String(payload.source || "");
  if (!source.trim()) throw new Error("PDF source HTML is required.");
  assertSafeMarkupSource(source);
  const timeoutMs = Number(payload.timeout_ms) > 0 ? Number(payload.timeout_ms) : 60000;
  const deadline = Date.now() + timeoutMs;
  const printReserveMs = Math.min(30000, Math.max(10000, Math.floor(timeoutMs * 0.2)));
  const pageWidthPt = Math.max(1, Number(payload.page_width_pt) || 960);
  const pageHeightPt = Math.max(1, Number(payload.page_height_pt) || 540);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    await securePageNetwork(page);
    await page.setContent(injectStaticContentSecurityPolicy(injectExportStabilityStyles(source)), {
      waitUntil: "load",
      timeout: remainingExportTime(deadline, "loading PDF HTML", printReserveMs),
    });
    await assertStaticDocument(page);
    await page.emulateMedia({ media: "print" });
    await waitForVisualAssets(
      page,
      remainingExportTime(deadline, "waiting for PDF visual assets", printReserveMs),
    );
    const pdf = await page.pdf({
      width: `${pageWidthPt / 72}in`,
      height: `${pageHeightPt / 72}in`,
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      timeout: remainingExportTime(deadline, "printing PDF"),
    });
    return { success: true, pdf_base64: pdf.toString("base64") };
  } finally {
    await context.close();
  }
}

module.exports = { renderPdf };
