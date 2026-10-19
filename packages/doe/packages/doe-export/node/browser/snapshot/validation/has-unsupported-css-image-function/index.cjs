// Origin: browser_snapshot.js::hasUnsupportedCssImageFunction
const { decodeCssIdentifierEscapes } = require("../decode-css-identifier-escapes/index.cjs");

function hasUnsupportedCssImageFunction(value) {
  const normalized = decodeCssIdentifierEscapes(value).replace(/\/\*[\s\S]*?\*\//g, "");
  return /(?:-webkit-)?(?:image-set|cross-fade)\s*\(/i.test(
    normalized,
  );
}

module.exports = { hasUnsupportedCssImageFunction };
