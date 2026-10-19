// Origin: browser_snapshot.js::requestedTraditionalSlideFontFamilies
const { sourceCodePoints } = require("../source-code-points/index.cjs");
const { isHanCodePoint } = require("../is-han-code-point/index.cjs");
const { traditionalSlideFontFamilies } = require("../../environment/index.cjs");
const { traditionalSlideFontClassFamilies } = require("../../environment/index.cjs");

function requestedTraditionalSlideFontFamilies(source) {
  const value = String(source || "");
  const requested = new Set(["Outfit"]);
  if (Array.from(sourceCodePoints(value)).some(isHanCodePoint)) requested.add("Noto Sans SC");
  for (const family of traditionalSlideFontFamilies) {
    if (value.toLowerCase().includes(family.toLowerCase())) requested.add(family);
  }
  for (const [className, family] of traditionalSlideFontClassFamilies) {
    if (new RegExp(`(?:^|[^a-z0-9_-])${className}(?:$|[^a-z0-9_-])`, "i").test(value)) {
      requested.add(family);
    }
  }
  return requested;
}

module.exports = { requestedTraditionalSlideFontFamilies };
