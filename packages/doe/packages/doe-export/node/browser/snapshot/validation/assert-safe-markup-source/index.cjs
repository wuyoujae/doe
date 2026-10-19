// Origin: browser_snapshot.js::assertSafeMarkupSource
const { assertNoUnsupportedAuthoredCssImageFunctions } = require("../assert-no-unsupported-authored-css-image-functions/index.cjs");
const { assertSafeSvgDataUrls } = require("../assert-safe-svg-data-urls/index.cjs");
const { invalidInputError } = require("../invalid-input-error/index.cjs");

function assertSafeMarkupSource(source) {
  const withoutCanonicalPayload = String(source || "").replace(
    /<script\b(?=[^>]*\bid=["']pptx2html-canonical-ir["'])(?=[^>]*\btype=["']application\/json["'])(?=[^>]*\bdata-pptx2html-ir=["']1["'])[^>]*>[\s\S]*?<\/script\s*>/gi,
    "",
  );
  assertNoUnsupportedAuthoredCssImageFunctions(withoutCanonicalPayload);
  assertSafeSvgDataUrls(withoutCanonicalPayload);
  if (/<\s*(?:script|iframe|object|embed|base|link)\b/i.test(withoutCanonicalPayload)) {
    throw invalidInputError("Unsafe HTML rejected: active elements are not allowed.");
  }
  if (/<meta\b(?=[^>]*\bhttp-equiv\s*=\s*["']?\s*refresh\b)[^>]*>/i.test(withoutCanonicalPayload)) {
    throw invalidInputError("Unsafe HTML rejected: meta refresh is not allowed.");
  }
  if (/\s+on[a-z0-9_:-]+\s*=/i.test(withoutCanonicalPayload)) {
    throw invalidInputError("Unsafe HTML rejected: event handler attributes are not allowed.");
  }
  if (/\s+srcdoc\s*=/i.test(withoutCanonicalPayload)) {
    throw invalidInputError("Unsafe HTML rejected: srcdoc is not allowed.");
  }
  if (/<\s*(?:animate|animateMotion|animateTransform|discard|feImage|foreignObject|set)\b/i.test(withoutCanonicalPayload)) {
    throw invalidInputError("Unsafe HTML rejected: active SVG elements are not allowed.");
  }
}

module.exports = { assertSafeMarkupSource };
