// Origin: browser_snapshot.js::assertSafeSvgDataUrls
const { assertSafeSvgDataUrlValue } = require("../assert-safe-svg-data-url-value/index.cjs");
const { invalidInputError } = require("../invalid-input-error/index.cjs");

function assertSafeSvgDataUrls(source) {
  const markup = String(source || "");
  const attributePattern = /\b(?:background|href|poster|src|xlink:href)\s*=\s*(?:(["'])(data:image\/svg\+xml[^"']*)\1|(data:image\/svg\+xml[^\s>]*))/gi;
  for (const match of markup.matchAll(attributePattern)) {
    assertSafeSvgDataUrlValue(match[2] || match[3]);
  }
  const cssPattern = /url\s*\(\s*(?:(["'])(data:image\/svg\+xml[^"']*)\1|(?:&#x27;|&#39;|&apos;)(data:image\/svg\+xml[\s\S]*?)(?:&#x27;|&#39;|&apos;)|(data:image\/svg\+xml[^)\s]*))\s*\)/gi;
  for (const match of markup.matchAll(cssPattern)) {
    assertSafeSvgDataUrlValue(match[2] || match[3] || match[4]);
  }
  if (
    /\b(?:imagesrcset|srcset)\s*=\s*(?:(["'])[^"']*data:image\/svg\+xml[^"']*\1|[^\s>]*data:image\/svg\+xml[^\s>]*)/i.test(
      markup,
    )
  ) {
    throw invalidInputError("Unsafe HTML rejected: unsupported SVG data URL placement.");
  }
}

module.exports = { assertSafeSvgDataUrls };
