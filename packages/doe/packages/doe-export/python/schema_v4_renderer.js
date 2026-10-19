const registeredThemeIds = require("../../doe-theme/src/registry/ids.json");
"use strict";

const fs = require("fs");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");
const { createRequire } = require("module");
const { resolveRendererRoot } = require("./renderer_root");
const { publicRoot, workspacePackageJson } = require("./runtime_paths");
const { printSchemaSlides } = require("./schema_v4_pdf");
const { mountSchemaSlide, throwIfLayoutFailure, layoutFailureEnvelope } = require("./schema_v4_layout_error");
const { inspectionReport, validateInspection } = require("./schema_v4_inspection");

const runtimePackageJson = path.join(__dirname, "package.json");
const runtimeRequire = createRequire(runtimePackageJson);
const postcss = runtimeRequire("postcss");

function loadPlaywright() {
  const anchors = [
    process.env.YRKIE_HTMLIR_PLAYWRIGHT_PACKAGE_JSON,
    runtimePackageJson,
    workspacePackageJson,
  ].filter(Boolean);
  const errors = [];
  for (const anchor of anchors) {
    if (!fs.existsSync(anchor)) continue;
    try {
      const anchoredRequire = createRequire(anchor);
      try {
        return anchoredRequire("playwright-core");
      } catch (_error) {
        return anchoredRequire("playwright");
      }
    } catch (error) {
      errors.push(`${anchor}: ${error?.message || String(error)}`);
    }
  }
  throw new Error(`Unable to resolve Playwright. ${errors.join(" | ")}`);
}

const { chromium } = loadPlaywright();

function rendererRoot() {
  const configured = String(process.env.YRKIE_SCHEMA_RENDERER_ROOT || "").trim();
  const root = resolveRendererRoot(
    configured,
    path.join(publicRoot(), "yrkie-doe"),
  );
  const entry = path.join(root, "export-runtime", "index.html");
  if (!fs.existsSync(entry)) throw new Error(`Yrkie-doe export runtime is missing: ${entry}`);
  return { root, entry };
}

function browserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    chromium.executablePath(),
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function mimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return ({
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  })[extension] || "application/octet-stream";
}

function materializeAssets(value, assets) {
  if (Array.isArray(value)) return value.map((item) => materializeAssets(item, assets));
  if (!value || typeof value !== "object") {
    if (typeof value !== "string") return value;
    if (value === "/yrkie-doe/brand/logo-text.webp") {
      const file = path.join(rendererRoot().root, "brand", "logo-text.webp");
      return `data:image/webp;base64,${fs.readFileSync(file).toString("base64")}`;
    }
    const match = value.match(/^yrkie-asset-(data|base64):\/\/([0-9a-f]{64})$/i);
    if (!match) return value;
    const asset = assets[String(match[2]).toLowerCase()];
    if (!asset?.base64) throw new Error(`Schema Deck asset is unavailable: ${match[2]}`);
    return match[1].toLowerCase() === "base64"
      ? asset.base64
      : `data:${asset.content_type || "application/octet-stream"};base64,${asset.base64}`;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, materializeAssets(item, assets)]),
  );
}

function ensureLocalFile(root, filePath) {
  const resolved = path.resolve(filePath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Export CSS references a file outside the renderer root: ${resolved}`);
  }
  const stat = fs.statSync(resolved);
  if (!stat.isFile() || stat.size > 20 * 1024 * 1024) {
    throw new Error(`Export CSS resource is invalid: ${resolved}`);
  }
  return resolved;
}

async function inlineStyleSheetResources(sheet, root) {
  const css = stripFontFaceRules(sheet.css);
  const pattern = /url\(\s*(["']?)([^"')]+)\1\s*\)/gi;
  let cursor = 0;
  let output = "";
  for (const match of css.matchAll(pattern)) {
    output += css.slice(cursor, match.index);
    cursor = match.index + match[0].length;
    const raw = String(match[2] || "").trim();
    if (!raw || /^(?:data:|blob:|#)/i.test(raw)) {
      output += match[0];
      continue;
    }
    const url = new URL(raw, sheet.href);
    if (url.protocol !== "file:") {
      throw new Error(`Export CSS contains a non-local resource: ${url.href}`);
    }
    const filePath = ensureLocalFile(root, fileURLToPath(url));
    const data = fs.readFileSync(filePath).toString("base64");
    output += `url("data:${mimeType(filePath)};base64,${data}")`;
  }
  return output + css.slice(cursor);
}

function stripFontFaceRules(css) {
  const document = postcss.parse(String(css || ""), { from: undefined });
  document.walkAtRules((rule) => {
    if (String(rule.name || "").trim().toLowerCase() === "font-face") {
      rule.remove();
    }
  });
  return document.toString();
}

async function staticStyleSheet(styleSheets, root) {
  const sheets = [];
  for (const sheet of styleSheets || []) {
    sheets.push(await inlineStyleSheetResources(sheet, root));
  }
  return sheets.join("\n").replace(/<\/style/gi, "<\\/style");
}

async function waitForVisualAssets(page, inspectBackgrounds = false) {
  await page.evaluate(async (inspectBackgrounds) => {
    if (document.fonts?.ready) await document.fonts.ready;
    const images = Array.from(document.images || []);
    // Page artwork uses CSS backgrounds, which are not in document.images.
    if (inspectBackgrounds) {
      for (const layer of document.querySelectorAll(".schema-slide__background-image")) {
        const value = layer.style.backgroundImage;
        if (!value || value === "none") continue;
        const match = /^url\((.*)\)$/.exec(value);
        if (!match) throw new Error("Inspection background source is invalid.");
        const encoded = match[1];
        const source = encoded.startsWith('"') ? JSON.parse(encoded) : encoded;
        const image = new Image();
        image.src = source;
        images.push(image);
      }
    }
    await Promise.all(images.map(async (image) => {
      if (!image.complete) {
        await new Promise((resolve, reject) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", () => reject(new Error("Schema slide image failed to load.")), { once: true });
        });
      }
      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error("Schema slide image decoded without dimensions.");
      }
      if (typeof image.decode === "function") await image.decode();
    }));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, inspectBackgrounds);
}

async function render(payload) {
  const { root, entry } = rendererRoot();
  const isPdf = payload.output_format === "pdf";
  const isInspection = payload.output_format === "inspect";
  if (payload.output_format !== undefined && !isPdf && !isInspection) throw new Error("Unsupported Schema export format.");
  const deck = materializeAssets(payload.deck, payload.assets || {});
  const slides = deck?.deck?.slides;
  if (!registeredThemeIds.includes(deck?.deck?.theme)) {
    throw new Error("Schema Deck theme must be registered.");
  }
  if (!Array.isArray(slides) || slides.length < 1 || slides.length > 300) {
    throw new Error("Schema Deck must contain between 1 and 300 slides.");
  }
  const slideIndices = payload.slide_indices === undefined
    ? slides.map((_slide, index) => index)
    : payload.slide_indices;
  if (
    !Array.isArray(slideIndices)
    || slideIndices.length < 1
    || slideIndices.length > slides.length
    || new Set(slideIndices).size !== slideIndices.length
    || slideIndices.some((index) => !Number.isInteger(index) || index < 0 || index >= slides.length)
  ) {
    throw new Error("Schema Deck slide_indices are invalid.");
  }
  const totalSlides = payload.total_slides === undefined
    ? slides.length
    : payload.total_slides;
  if (!Number.isInteger(totalSlides) || totalSlides < slides.length || totalSlides > 300) {
    throw new Error("Schema Deck total_slides is invalid.");
  }
  if (isInspection) validateInspection(deck, payload.page_number, totalSlides);

  const executablePath = browserExecutable();
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--allow-file-access-from-files", "--disable-dev-shm-usage", "--no-sandbox"],
  });
  let inspectionCancelled = false;
  let inspectionTimedOut = false;
  const inspectionTimer = isInspection ? setInterval(() => {
    if (payload.cancellation_file && fs.existsSync(payload.cancellation_file)) {
      inspectionCancelled = true;
      browser.close().catch(() => {});
    }
  }, 150) : null;
  const inspectionDeadline = isInspection ? setTimeout(() => {
    inspectionTimedOut = true;
    browser.close().catch(() => {});
  }, 45_000) : null;
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    if (isPdf || isInspection) {
      const allowedRoot = fs.realpathSync(publicRoot());
      await page.context().route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.protocol === "data:") return route.continue();
        if (url.protocol === "file:") {
          try {
            ensureLocalFile(allowedRoot, fs.realpathSync(fileURLToPath(url)));
            return route.continue();
          } catch (_error) { /* Deny paths outside the public renderer assets. */ }
        }
        return route.abort("accessdenied");
      });
    }
    await page.goto(pathToFileURL(entry).href, { waitUntil: "load", timeout: 30_000 });
    await page.waitForFunction(() => Boolean(window.YrkieDoeExportRuntime), null, { timeout: 30_000 });
    const viewport = await page.evaluate(() => ({ width: window.SlideEngine.CANVAS.renderWidth, height: window.SlideEngine.CANVAS.renderHeight }));
    await page.setViewportSize(viewport);
    if (isInspection) {
      if (viewport.width > 2048 || viewport.height > 2048 || viewport.width * viewport.height > 4_000_000) {
        throw new Error("Inspection viewport exceeds the image budget.");
      }
      await page.evaluate(async ({ slide, pageNumber, total, theme, logo, numbering }) => {
        const mounted = await window.YrkieDoeExportRuntime.inspectSlide(slide, pageNumber - 1, total, theme, undefined, logo, numbering);
        const { element } = await mounted.result.whenSettled();
        if (!element?.isConnected || getComputedStyle(element).opacity === "0") throw new Error("Inspection canvas is not settled.");
        if (numbering?.enabled === true) {
          const expected = numbering.format === "fraction" ? `${pageNumber}/${total}` : String(pageNumber);
          if (element.querySelector(".schema-page-number")?.textContent.replace(/\s+/g, "") !== expected) {
            throw new Error("Inspection page numbering does not match the saved deck.");
          }
        }
      }, { slide: slides[0], pageNumber: payload.page_number, total: totalSlides, theme: deck.deck.theme, logo: deck.logo, numbering: deck.pageNumber });
      await waitForVisualAssets(page, true).catch(error => {
        error.previewCode = "doe_preview_assets_unavailable";
        throw error;
      });
      const measured = await page.evaluate(id => window.YrkieDoeExportRuntime.captureInspection(id), slides[0].id);
      if (inspectionCancelled) throw new Error("Inspection cancelled.");
      const png = await page.screenshot({ type: "png" });
      if (!png.length || png.length > 6 * 1024 * 1024) throw new Error("Inspection image exceeds the output budget.");
      const report = inspectionReport(measured.report, measured.diagnostics);
      if (Buffer.byteLength(JSON.stringify(report)) > 64 * 1024) throw new Error("Inspection report exceeds the output budget.");
      return { success: true, renderer_contract: "yrkie-doe-schema-v4-server-renderer-v101", viewport,
        page_number: payload.page_number, report, png_base64: png.toString("base64") };
    }
    const capturePage = payload.include_screenshots
      ? await browser.newPage({ viewport, deviceScaleFactor: 1 })
      : null;
    if (capturePage) {
      await capturePage.goto(pathToFileURL(entry).href, { waitUntil: "load", timeout: 30_000 });
    }
    const rendered = [];
    let styleSheets = null;
    for (const index of slideIndices) {
      const mounted = await page.evaluate(mountSchemaSlide,
        { slide: slides[index], index, total: totalSlides, theme: deck.deck.theme, logo: deck.logo, flowLayout: payload.flow_layout });
      throwIfLayoutFailure(mounted, totalSlides);
      await waitForVisualAssets(page);
      const snapshot = await page.evaluate(({ slide }) =>
        window.YrkieDoeExportRuntime.captureSnapshot(slide.id), mounted);
      const sourceScreenshot = payload.include_screenshots
        ? (await page.screenshot({ type: "png" })).toString("base64")
        : null;
      let screenshot;
      if (capturePage) {
        await capturePage.evaluate((rootHtml) => {
          document.body.innerHTML = rootHtml;
        }, snapshot.rootHtml);
        await waitForVisualAssets(capturePage);
        screenshot = (await capturePage.screenshot({ type: "png" })).toString("base64");
      }
      if (styleSheets === null) styleSheets = snapshot.styleSheets || [];
      rendered.push({
        id: String(slides[index]?.id || `slide-${index + 1}`),
        title: String(slides[index]?.title || slides[index]?.name || `Slide ${index + 1}`),
        root_html: snapshot.rootHtml,
        native_components: snapshot.nativeComponents || [],
        ...(screenshot ? { screenshot_png_base64: screenshot } : {}),
        ...(sourceScreenshot ? { source_screenshot_png_base64: sourceScreenshot } : {}),
      });
    }
    if (capturePage) await capturePage.close();
    if (isPdf) {
      await page.evaluate(title => { document.title = title; }, String(deck.deck.title || "Yrkie presentation"));
      const pdf = await printSchemaSlides(page, rendered, payload.watermark_data_uri || null);
      if (pdf.length > 128 * 1024 * 1024) throw new Error("Schema PDF output is too large.");
      return {
        success: true,
        renderer_contract: "yrkie-doe-schema-v4-server-renderer-v101",
        pdf_contract: "yrkie-doe-schema-pdf-v1",
        slide_count: rendered.length,
        ...(payload.include_screenshots ? { slides: rendered } : {}),
        pdf_base64: pdf.toString("base64"),
      };
    }
    await page.close();
    return {
      success: true,
      renderer_contract: "yrkie-doe-schema-v4-server-renderer-v101",
      viewport,
      stylesheet: payload.include_stylesheet === false
        ? ""
        : await staticStyleSheet(styleSheets || [], root),
      slides: rendered,
    };
  } catch (error) {
    if (isInspection) error.previewCode = inspectionCancelled ? "doe_preview_cancelled"
      : inspectionTimedOut ? "doe_preview_timeout" : error.previewCode || "doe_preview_unavailable";
    throw error;
  } finally {
    if (inspectionTimer) clearInterval(inspectionTimer);
    if (inspectionDeadline) clearTimeout(inspectionDeadline);
    await browser.close();
  }
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const result = await render(payload);
  process.stdout.write(JSON.stringify(result));
}

if (require.main === module) {
  main().catch((error) => {
    const failure = layoutFailureEnvelope(error);
    if (error.previewCode) process.stdout.write(JSON.stringify({ success: false, code: error.previewCode }));
    else if (failure) process.stdout.write(JSON.stringify(failure));
    else process.stderr.write(`${error?.stack || error}\n`);
    process.exitCode = 1;
  });
}

module.exports = { materializeAssets, render, stripFontFaceRules };
