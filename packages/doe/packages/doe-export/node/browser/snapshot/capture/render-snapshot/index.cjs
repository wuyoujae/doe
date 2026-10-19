// Origin: browser_snapshot.js::renderSnapshot
const { recoverCanonicalTailwindDocument } = require("../../html/recover-canonical-tailwind-document/index.cjs");
const { assertSafeMarkupSource } = require("../../validation/assert-safe-markup-source/index.cjs");
const { compileTailwindCss } = require("../../html/compile-tailwind-css/index.cjs");
const { traditionalSlideFontCss } = require("../../fonts/traditional-slide-font-css/index.cjs");
const { injectStyleIntoDocument } = require("../../html/inject-style-into-document/index.cjs");
const { compilerDocument } = require("../../html/compiler-document/index.cjs");
const { securePageNetwork } = require("../../validation/secure-page-network/index.cjs");
const { injectExportStabilityStyles } = require("../../html/inject-export-stability-styles/index.cjs");
const { injectStaticContentSecurityPolicy } = require("../../validation/inject-static-content-security-policy/index.cjs");
const { remainingExportTime } = require("../../assets/remaining-export-time/index.cjs");
const { assertStaticDocument } = require("../../validation/assert-static-document/index.cjs");
const { expandLucideIcons } = require("../../icons/expand-lucide-icons/index.cjs");
const { lucideIconSources } = require("../../icons/lucide-icon-sources/index.cjs");
const { finalizeCssAnimations } = require("../finalize-css-animations/index.cjs");
const { fitCanonicalFragmentToViewport } = require("../fit-canonical-fragment-to-viewport/index.cjs");
const { waitForVisualAssets } = require("../../assets/wait-for-visual-assets/index.cjs");
const { captureSnapshotPng } = require("../capture-snapshot-png/index.cjs");
const { renderSnapshotInPage1 } = require("../../page/render-snapshot-in-page1/index.cjs");

async function renderSnapshot(browser, payload) {
  const fragment = typeof payload.fragment === "string" ? payload.fragment : null;
  const recoveredSource = fragment === null
    ? await recoverCanonicalTailwindDocument(String(payload.source || ""))
    : null;
  assertSafeMarkupSource(fragment === null ? recoveredSource : fragment);
  const generatedCss = fragment === null ? "" : await compileTailwindCss(fragment);
  const viewport = payload.viewport || {};
  const width = Number(viewport.width) > 0 ? Number(viewport.width) : 1280;
  const height = Number(viewport.height) > 0 ? Number(viewport.height) : 720;
  const fontSource = fragment === null ? recoveredSource : fragment;
  const fontCss = traditionalSlideFontCss(fontSource);
  const source = fragment === null
    ? injectStyleIntoDocument(recoveredSource, `<style id="traditional-slide-font-css">${fontCss}</style>`)
    : compilerDocument(fragment, generatedCss, fontCss, width, height);
  const timeoutMs = Number(payload.timeout_ms) > 0 ? Number(payload.timeout_ms) : 20000;
  const deadline = Date.now() + timeoutMs;
  const captureReserveMs = payload.screenshot_only
    ? Math.min(5000, Math.max(1500, Math.floor(timeoutMs * 0.12)))
    : 0;
  const maxNodes = Number(payload.max_nodes) > 0 ? Number(payload.max_nodes) : 5000;
  const diagnostics = [];
  const consoleMessages = [];
  const pageErrors = [];

  const deviceScaleFactor = Math.max(1, Math.min(Number(payload.device_scale_factor) || 1, 3));
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor,
    colorScheme: "light",
    serviceWorkers: "block",
  });
  try {
    const page = await context.newPage();
    await securePageNetwork(page, diagnostics);
    page.on("console", (message) => {
      consoleMessages.push({
        type: message.type(),
        text: message.text().slice(0, 500),
      });
    });
    page.on("pageerror", (error) => {
      pageErrors.push(String(error && error.message ? error.message : error).slice(0, 500));
    });

    const stableSource = payload.screenshot_only ? injectExportStabilityStyles(source) : source;
    await page.setContent(injectStaticContentSecurityPolicy(stableSource), {
      waitUntil: "load",
      timeout: remainingExportTime(deadline, "loading HTML", captureReserveMs),
    });
    await assertStaticDocument(page);
    if (fragment !== null) await expandLucideIcons(page, lucideIconSources(fragment));
    const finalizedAnimations = fragment !== null
      ? await finalizeCssAnimations(page)
      : { finalized: 0, cancelled: 0 };
    if (finalizedAnimations.finalized || finalizedAnimations.cancelled) {
      diagnostics.push({
        severity: finalizedAnimations.cancelled ? "warning" : "info",
        code: "css-animations-finalized",
        message: `Finalized ${finalizedAnimations.finalized} CSS animation(s) at their static end state${
          finalizedAnimations.cancelled
            ? `; cancelled ${finalizedAnimations.cancelled} unsupported animation(s)`
            : ""
        }.`,
      });
    }
    const canonicalFragmentFit = fragment !== null
      ? await fitCanonicalFragmentToViewport(page)
      : null;
    if (canonicalFragmentFit) {
      diagnostics.push({
        severity: "info",
        code: "canonical-fragment-viewport-fit",
        message: `Fitted standalone canonical slide ${canonicalFragmentFit.sourceWidth}x${canonicalFragmentFit.sourceHeight}px to ${canonicalFragmentFit.targetWidth}x${canonicalFragmentFit.targetHeight}px.`,
      });
    }
    const imageWaitBudget = remainingExportTime(
      deadline,
      "waiting for visual assets",
      captureReserveMs,
    );
    await waitForVisualAssets(
      page,
      payload.screenshot_only ? imageWaitBudget : Math.min(imageWaitBudget, 2000),
      { failOnError: Boolean(payload.screenshot_only) },
    );

    if (payload.screenshot_only) {
      const png = await captureSnapshotPng(page, payload, deadline, "capturing PNG");
      return {
        success: true,
        viewport: { width, height },
        deviceScaleFactor,
        screenshot_png_base64: png.toString("base64"),
        diagnostics,
        consoleMessages,
        pageErrors,
      };
    }

    const snapshot = await page.evaluate(renderSnapshotInPage1, {
      limit: maxNodes,
      doeAlexandriaCodepoints: payload.doe_alexandria_codepoints || [],
      rootSelector: fragment === null ? payload.root_selector || null : "#slide-content > :first-child",
    });

    if (snapshot.truncated) {
      diagnostics.push({
        severity: "warning",
        code: "dom-snapshot-truncated",
        message: `DOM snapshot exceeded ${maxNodes} nodes and was truncated.`,
      });
    }
    if (snapshot.document.scriptCount > 0) {
      diagnostics.push({
        severity: "warning",
        code: "script-present",
        message: "HTML contains script elements. The browser snapshot reflects the current rendered state, but script behavior is not converted into editable IR.",
      });
    }

    const png = payload.skip_screenshot
      ? null
      : await captureSnapshotPng(
        page,
        payload,
        deadline,
        "capturing browser snapshot",
      );

    // Office has no CSS alpha-mask equivalent. Preserve only the affected
    // raster image's painted pixels, at 3x resolution, with real transparency.
    // Text, charts and every other DOM object remain independent editable shapes.
    const maskedImages = snapshot.nodes.filter((node) => node.visible && node.media?.hasPaintMask);
    if (maskedImages.length) {
      const session = await context.newCDPSession(page);
      await session.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
      await page.evaluate(() => {
        for (const element of document.querySelectorAll("*")) element.style.setProperty("visibility", "hidden", "important");
        for (const element of [document.documentElement, document.body]) element.style.setProperty("background", "transparent", "important");
        const style = document.createElement("style");
        style.textContent = "*::before,*::after{visibility:hidden!important}";
        document.head.appendChild(style);
      });
      for (const node of maskedImages) {
        const x = Math.max(0, Math.floor(node.rect.left));
        const y = Math.max(0, Math.floor(node.rect.top));
        const right = Math.min(width, Math.ceil(node.rect.right));
        const bottom = Math.min(height, Math.ceil(node.rect.bottom));
        if (right <= x || bottom <= y) continue;
        await page.locator(node.path).evaluate((element) => {
          element.style.setProperty("visibility", "visible", "important");
          // A hidden ancestor does not establish its mask painting layer in
          // Chromium. Keep the ancestor chain visible but remove its own paint.
          for (let owner = element.parentElement; owner; owner = owner.parentElement) {
            for (const [key, value] of Object.entries({ visibility: "visible", background: "transparent",
              "border-color": "transparent", "box-shadow": "none", color: "transparent", "text-shadow": "none" })) {
              owner.style.setProperty(key, value, "important");
            }
          }
        });
        remainingExportTime(deadline, "capturing image mask");
        const image = await session.send("Page.captureScreenshot", { format: "png", fromSurface: true,
          clip: { x, y, width: right - x, height: bottom - y, scale: 3 / deviceScaleFactor } });
        node.media.paintedSrc = `data:image/png;base64,${image.data}`;
        node.media.paintedRect = { left: x, top: y, width: right - x, height: bottom - y };
        await page.locator(node.path).evaluate((element) => element.style.setProperty("visibility", "hidden", "important"));
      }
      await session.detach();
    }

    return {
      success: true,
      viewport: { width, height },
      deviceScaleFactor,
      screenshot_png_base64: png ? png.toString("base64") : null,
      snapshot,
      diagnostics,
      consoleMessages,
      pageErrors,
    };
  } finally {
    await context.close();
  }
}

module.exports = { renderSnapshot };
