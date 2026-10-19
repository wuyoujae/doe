// Origin: browser_snapshot.js::recoverCanonicalTailwindDocument
const { compileTailwindCss } = require("../compile-tailwind-css/index.cjs");
const { readStaticTailwindTheme } = require("../read-static-tailwind-theme/index.cjs");
const { runtimeCss } = require("../../environment/index.cjs");
const { injectStyleIntoDocument } = require("../inject-style-into-document/index.cjs");

async function recoverCanonicalTailwindDocument(rawSource) {
  const source = String(rawSource || "");
  if (!/data-pptx2html-canonical\s*=\s*["']1["']/i.test(source)) return source;

  let removedBootstrap = false;
  const configSources = [];
  let recovered = source.replace(
    /<script\b(?=[^>]*\bsrc\s*=\s*["']https:\/\/cdn\.tailwindcss\.com\/?(?:\?[^"']*)?["'])[^>]*>\s*<\/script\s*>/gi,
    () => {
      removedBootstrap = true;
      return "";
    },
  );
  recovered = recovered.replace(
    /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script\s*>/gi,
    (match, body) => {
      const value = String(body || "").trim();
      if (!/^tailwind\.config\s*=\s*\{[\s\S]*\}\s*;?$/i.test(value)) return match;
      configSources.push(value);
      return "";
    },
  );
  recovered = recovered.replace(
    /<script\b([^>]*)>[\s\S]*?<\/script\s*>/gi,
    (match, attributes) => {
      const value = String(attributes || "");
      const isCanonicalPayload = /\bid\s*=\s*["']pptx2html-canonical-ir["']/i.test(value)
        && /\btype\s*=\s*["']application\/json["']/i.test(value)
        && /\bdata-pptx2html-ir\s*=\s*["']1["']/i.test(value)
        && !/\bsrc\s*=/i.test(value);
      return isCanonicalPayload ? match : "";
    },
  );
  if (!removedBootstrap) return recovered;

  const generatedCss = await compileTailwindCss(recovered, readStaticTailwindTheme(configSources));
  const style = `<style id="yrkie-recovered-tailwind-css">${runtimeCss}\n${generatedCss}</style>`;
  return injectStyleIntoDocument(recovered, style);
}

module.exports = { recoverCanonicalTailwindDocument };
