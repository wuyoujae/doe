// Origin: browser_snapshot.js::traditionalSlideFontCss
const { requestedTraditionalSlideFontFamilies } = require("../requested-traditional-slide-font-families/index.cjs");
const { sourceCodePoints } = require("../source-code-points/index.cjs");
const { trustedTraditionalSlideFontFaces } = require("../../environment/index.cjs");
const { fontFaceMatchesAuthoredStyle } = require("../../html/font-face-matches-authored-style/index.cjs");
const { unicodeRangeIncludesSource } = require("../unicode-range-includes-source/index.cjs");
const { inlineTrustedFontFace } = require("../inline-trusted-font-face/index.cjs");

function traditionalSlideFontCss(source) {
  const value = String(source || "");
  const requestedFamilies = requestedTraditionalSlideFontFamilies(value);
  const codePoints = sourceCodePoints(value);
  return trustedTraditionalSlideFontFaces
    .filter(({ block }) => {
      const family = block.match(/font-family\s*:\s*["']?([^;"']+)["']?\s*;/i)?.[1]?.trim();
      return family
        && requestedFamilies.has(family)
        && fontFaceMatchesAuthoredStyle(block, value)
        && unicodeRangeIncludesSource(block, codePoints);
    })
    .map(inlineTrustedFontFace)
    .join("\n");
}

module.exports = { traditionalSlideFontCss };
