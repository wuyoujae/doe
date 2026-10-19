const fs = require("fs");
const { fontFaceBlocks } = require("../capture/font-face-blocks/index.cjs");

const path = require("path");
const sourceDirectory = path.resolve(__dirname, "../../../../python/pptx2html/htmlir");

const readline = require("readline");

const { createRequire } = require("module");

const { publicRoot, workspacePackageJson } = require("../../../../python/runtime_paths.js");

const runtimePackageJson = path.join(sourceDirectory, "..", "..", "package.json");

const runtimeRequire = createRequire(runtimePackageJson);

const postcss = runtimeRequire("postcss");

const tailwindcss = runtimeRequire("tailwindcss");

const lucideIconsRoot = path.dirname(runtimeRequire.resolve("lucide-static/package.json"));

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
      errors.push(`${anchor}: ${error && error.message ? error.message : String(error)}`);
    }
  }

  try {
    return require("playwright");
  } catch (error) {
    errors.push(`default require: ${error && error.message ? error.message : String(error)}`);
  }

  throw new Error(`Unable to resolve playwright. ${errors.join(" | ")}`);
}

const { chromium } = loadPlaywright();

const packagedTemplatePath = path.join(sourceDirectory, "..", "..", "resources", "template", "tmp.html");

const developmentTemplatePath = path.join(
  sourceDirectory,
  "..",
  "..",
  "..",
  "..",
  "resources",
  "template",
  "tmp.html",
);

const templatePath = fs.existsSync(packagedTemplatePath)
  ? packagedTemplatePath
  : developmentTemplatePath;

const templateSource = fs.readFileSync(templatePath, "utf8");

const runtimeCssMatch = templateSource.match(/<style\s+id=["']ethera-async-image-style["'][^>]*>([\s\S]*?)<\/style>/i);

if (!runtimeCssMatch) throw new Error(`Unable to find runtime CSS in ${templatePath}`);

const runtimeCss = runtimeCssMatch[1];

const themeFontSourcesRoot = path.resolve(sourceDirectory, "../../../../doe-theme/src/font/compatibility");

const frontendPublicRoot = publicRoot();

const traditionalSlideFontSources = [
  path.join(themeFontSourcesRoot, "application", "index.css"),
  path.join(themeFontSourcesRoot, "traditional", "index.css"),
  path.join(frontendPublicRoot, "fonts", "traditional-slide", "noto-sans-sc.css"),
  path.join(frontendPublicRoot, "yrkie-doe", "core", "slide.css"),
  path.join(frontendPublicRoot, "yrkie-doe", "core", "theme.css"),
];

const traditionalSlideFontFamilies = new Set([
  "Fraunces",
  "Manrope",
  "Infaxiswield Humanist",
  "Lora",
  "Source Han Serif",
  "Noto Sans SC",
  "Outfit",
  "MiSans",
  "Alexandria",
  "Tomorrow",
  "ZCOOL QingKe HuangYou",
  "EB Garamond",
  "IBM Plex Mono",
  "Fredoka",
  "Caveat",
]);

const traditionalSlideFontClassFamilies = new Map([
  ["font-fraunces", "Fraunces"],
  ["font-manrope", "Manrope"],
  ["font-infaxis", "Infaxiswield Humanist"],
  ["font-infaxiswield-humanist", "Infaxiswield Humanist"],
  ["font-lora", "Lora"],
  ["font-source-han-serif", "Source Han Serif"],
  ["font-noto-sans-sc", "Noto Sans SC"],
  ["font-outfit", "Outfit"],
  ["font-sans-cn", "Noto Sans SC"],
  ["font-serif-cn", "Source Han Serif"],
  ["font-sans-en", "Outfit"],
  ["font-misans", "MiSans"],
  ["font-alexandria", "Alexandria"],
]);

const trustedFontBinaryCache = new Map();

const trustedTraditionalSlideFontFaces = traditionalSlideFontSources
  .flatMap(fontFaceBlocks)
  .filter(({ block }) => {
    const family = block.match(/font-family\s*:\s*["']?([^;"']+)["']?\s*;/i)?.[1]?.trim();
    return family && traditionalSlideFontFamilies.has(family);
  });

const canonicalFragmentCss = `
.pptx-slide.pptx-canonical-slide {
  position: relative;
  display: block;
  margin: 0;
  overflow: hidden;
  transform-origin: 0 0;
}
.pptx-canonical-layer {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
}
.pptx-shape {
  position: absolute;
  box-sizing: border-box;
  overflow: visible;
}
.pptx-text-frame {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-kerning: normal;
  text-rendering: geometricPrecision;
  line-break: strict;
}
.pptx-paragraph {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: normal;
  word-break: normal;
}
.pptx-run {
  white-space: pre-wrap;
  font-kerning: normal;
}
`;

const staticContentSecurityPolicy = [
  "default-src 'none'",
  "script-src 'none'",
  "connect-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "img-src data: blob:",
  "font-src data:",
  "style-src 'unsafe-inline'",
].join("; ");

module.exports = { fs, path, readline, createRequire, publicRoot, workspacePackageJson, runtimePackageJson, runtimeRequire, postcss, tailwindcss, lucideIconsRoot, chromium, packagedTemplatePath, developmentTemplatePath, templatePath, templateSource, runtimeCssMatch, runtimeCss, themeFontSourcesRoot, frontendPublicRoot, traditionalSlideFontSources, traditionalSlideFontFamilies, traditionalSlideFontClassFamilies, trustedFontBinaryCache, trustedTraditionalSlideFontFaces, canonicalFragmentCss, staticContentSecurityPolicy, loadPlaywright };
