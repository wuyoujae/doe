const registeredThemeIds = require("../../doe-theme/src/registry/ids.json");
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { createRequire } = require("module");
const { resolveRendererRoot } = require("./renderer_root");
const { publicRoot, workspacePackageJson } = require("./runtime_paths");

const CONTRACT = "yrkie-slide-repair-render-gate-v1";
const ACCEPTED_ADAPTIVE_DIAGNOSTICS = new Set([
  "alternating-media-text-cards-paired",
  "capacity-packed",
  "collection-capacity-chunked",
  "depth-exited-composition",
  "implicit-planning-group-flattened",
  "invalid-collection-exited",
  "locked-collection-membership-mismatch",
  "nested-collection-flattened",
  "root-heading-support-grouped",
  "same-axis-flattened",
  "same-type-collection-normalized",
  "singleton-cluster-preserved",
  "singleton-collapsed",
  "singleton-collection-collapsed",
  "singleton-exited-composition",
]);

function loadPlaywright() {
  const anchors = [
    process.env.YRKIE_HTMLIR_PLAYWRIGHT_PACKAGE_JSON,
    path.resolve(__dirname, "package.json"),
    workspacePackageJson,
  ].filter(Boolean);
  for (const anchor of anchors) {
    if (!fs.existsSync(anchor)) continue;
    const anchoredRequire = createRequire(anchor);
    try {
      return anchoredRequire("playwright-core");
    } catch (_error) {
      try {
        return anchoredRequire("playwright");
      } catch (_secondError) {
        // Try the next pinned dependency root.
      }
    }
  }
  throw new Error("Slide repair render gate cannot resolve Playwright.");
}

function browserExecutable(chromium) {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    typeof chromium.executablePath === "function" ? chromium.executablePath() : "",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
  );
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

const CONTROL_FACT_KEYS = new Set([
  "id", "type", "kind", "size", "layout", "theme", "editor", "unit",
  "page_number", "level", "fit", "position", "aspectRatio", "ratio", "role",
  "region", "variant", "direction", "preset", "intent", "collectionKey", "icon",
]);
const NON_RENDERED_COMPONENT_TITLE_TYPES = new Set([
  "grouped-bar-chart",
  "line-chart",
  "stacked-bar-chart",
  "risk-matrix",
  "waterfall-chart",
  "radar-chart",
  "donut-chart",
]);

function normalizedFact(value) {
  return String(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function numberFacts(value) {
  return String(value)
    .split(/[^0-9.,%+\-]+/u)
    .filter((item) => /[0-9]/u.test(item))
    .map((item) => item.replaceAll(",", ""));
}

function collectBusinessFacts(value, key = null, componentType = null, output = null) {
  const facts = output || {
    strings: new Set(), numbers: new Set(), urls: new Set(), attributions: new Set(),
  };
  if (key && CONTROL_FACT_KEYS.has(key)) return facts;
  if (Array.isArray(value)) {
    for (const item of value) collectBusinessFacts(item, key, componentType, facts);
    return facts;
  }
  if (value && typeof value === "object") {
    const nextType = typeof value.type === "string" ? value.type : componentType;
    for (const [childKey, item] of Object.entries(value)) {
      if (
        key === "props"
        && childKey === "title"
        && NON_RENDERED_COMPONENT_TITLE_TYPES.has(nextType)
      ) continue;
      collectBusinessFacts(item, childKey, nextType, facts);
    }
    return facts;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    facts.numbers.add(String(value));
    return facts;
  }
  if (typeof value !== "string" || value.trim() === "") return facts;
  const text = value.trim();
  for (const number of numberFacts(text)) facts.numbers.add(number);
  if (
    text.startsWith("https://")
    || text.startsWith("yrkie-asset-data://")
    || text.startsWith("yrkie-asset-base64://")
  ) facts.urls.add(text);
  const normalized = normalizedFact(text);
  if (normalized.length >= 2) {
    facts.strings.add(normalized);
    if (
      ["author", "source", "citation"].includes(key)
      || (componentType === "quote" && key === "text")
    ) facts.attributions.add(normalized);
  }
  return facts;
}

function sortedFacts(facts) {
  return Object.fromEntries(
    Object.entries(facts).map(([key, values]) => [key, [...values].sort()]),
  );
}

function businessPreservation(source, compiled) {
  const sourceFacts = sortedFacts(collectBusinessFacts(source));
  const compiledFacts = sortedFacts(collectBusinessFacts(compiled));
  const missingStrings = sourceFacts.strings.filter(
    (value) => !compiledFacts.strings.some(
      (candidate) => candidate.includes(value) || value.includes(candidate),
    ),
  );
  const missingNumbers = sourceFacts.numbers.filter(
    (value) => !compiledFacts.numbers.includes(value),
  );
  const missingUrls = sourceFacts.urls.filter((value) => !compiledFacts.urls.includes(value));
  const missingAttributions = sourceFacts.attributions.filter(
    (value) => !compiledFacts.strings.some(
      (candidate) => candidate.includes(value) || value.includes(candidate),
    ),
  );
  const missingCount = missingStrings.length
    + missingNumbers.length
    + missingUrls.length
    + missingAttributions.length;
  return {
    preserved: missingCount === 0,
    missingCount,
    sourceHash: hash(sourceFacts),
    compiledHash: hash(compiledFacts),
  };
}

function diagnosticSummary(result) {
  const compiler = Array.isArray(result.compilerDiagnostics) ? result.compilerDiagnostics : [];
  const runtime = Array.isArray(result.runtimeDiagnostics) ? result.runtimeDiagnostics : [];
  const repairs = compiler
    .filter((item) => item?.level === "repair")
    .map((item) => String(item.code || "unknown"));
  return {
    hard: [...compiler, ...runtime]
      .filter((item) => item?.level === "error")
      .map((item) => String(item.code || "unknown")),
    repairs: repairs.filter((code) => !ACCEPTED_ADAPTIVE_DIAGNOSTICS.has(code)),
    adaptive: repairs.filter((code) => ACCEPTED_ADAPTIVE_DIAGNOSTICS.has(code)),
  };
}

function reportSummary(report) {
  if (!report || typeof report !== "object") return null;
  return {
    fits: report.fits === true,
    overflowX: Number(report.overflowX || 0),
    overflowY: Number(report.overflowY || 0),
    overlaps: Number(report.overlaps || 0),
    minWidthViolations: Number(report.minWidthViolations || 0),
    minHeightViolations: Number(report.minHeightViolations || 0),
    compressionFitViolations: Number(report.compressionFitViolations || 0),
    semanticWrapViolations: Number(report.semanticWrapViolations || 0),
    minFontViolations: Number(report.minFontViolations || 0),
  };
}

async function mount(page, slide, pageIndex, pageCount, theme) {
  return page.evaluate(async ({ slide, pageIndex, pageCount, theme }) => {
    const mounted = await window.YrkieDoeExportRuntime.renderSlide(slide, pageIndex, pageCount, theme);
    return {
      slide: mounted.result.slide,
      compilerDiagnostics: mounted.result.compilerDiagnostics || [],
      runtimeDiagnostics: mounted.result.runtimeDiagnostics || [],
      report: mounted.result.report || null,
    };
  }, { slide, pageIndex, pageCount, theme });
}

async function run(payload) {
  const slides = payload?.deck?.deck?.slides;
  if (!registeredThemeIds.includes(payload?.deck?.deck?.theme)) {
    throw new Error("Slide repair render gate requires a registered deck theme.");
  }
  if (!Array.isArray(slides) || slides.length < 1 || slides.length > 200) {
    throw new Error("Slide repair render gate requires a schema-v4 Deck.");
  }
  const rendererRoot = resolveRendererRoot(
    process.env.YRKIE_SCHEMA_RENDERER_ROOT,
    path.join(publicRoot(), "yrkie-doe"),
  );
  const entry = path.join(rendererRoot, "export-runtime", "index.html");
  if (!fs.existsSync(entry)) throw new Error("Yrkie-doe export runtime is unavailable.");

  const { chromium } = loadPlaywright();
  const executablePath = browserExecutable(chromium);
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ["--allow-file-access-from-files", "--disable-dev-shm-usage", "--no-sandbox"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(pathToFileURL(entry).href, { waitUntil: "load", timeout: 30_000 });
    await page.waitForFunction(() => Boolean(window.YrkieDoeExportRuntime), null, {
      timeout: 30_000,
    });
    const results = [];
    const theme = payload.deck.deck.theme;
    for (let pageIndex = 0; pageIndex < slides.length; pageIndex += 1) {
      const first = await mount(page, slides[pageIndex], pageIndex, slides.length, theme);
      const second = await mount(page, slides[pageIndex], pageIndex, slides.length, theme);
      const firstHash = hash(first.slide);
      const secondHash = hash(second.slide);
      const diagnostics = diagnosticSummary(first);
      const report = reportSummary(first.report);
      const preservation = businessPreservation(slides[pageIndex], first.slide);
      const validReport = report
        && report.fits
        && report.overflowX === 0
        && report.overflowY === 0
        && report.overlaps === 0
        && report.minWidthViolations === 0
        && report.minHeightViolations === 0
        && report.compressionFitViolations === 0
        && report.semanticWrapViolations === 0
        && report.minFontViolations === 0;
      results.push({
        page_index: pageIndex,
        deterministic: firstHash === secondHash,
        compiled_sha256: firstHash,
        hard_diagnostics: diagnostics.hard,
        repair_diagnostics: diagnostics.repairs,
        adaptive_diagnostics: diagnostics.adaptive,
        business_preserved: preservation.preserved,
        missing_business_facts: preservation.missingCount,
        source_business_sha256: preservation.sourceHash,
        compiled_business_sha256: preservation.compiledHash,
        report,
        accepted:
          firstHash === secondHash
          && diagnostics.hard.length === 0
          && diagnostics.repairs.length === 0
          && preservation.preserved
          && validReport,
      });
    }
    await page.close();
    return {
      success: results.every((result) => result.accepted),
      contract: CONTRACT,
      pages: results,
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const result = await run(payload);
  process.stdout.write(JSON.stringify(result));
  if (!result.success) process.exitCode = 2;
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error?.stack || error}\n`);
    process.exitCode = 1;
  });
}

module.exports = { businessPreservation, run };
