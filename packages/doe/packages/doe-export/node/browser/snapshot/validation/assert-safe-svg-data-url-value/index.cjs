// Origin: browser_snapshot.js::assertSafeSvgDataUrlValue
const { decodeSvgDataUrl } = require("../decode-svg-data-url/index.cjs");
const { invalidInputError } = require("../invalid-input-error/index.cjs");

function assertSafeSvgDataUrlValue(value) {
  const svg = decodeSvgDataUrl(value);
  if (!/^\s*(?:<\?xml\b[^?]*\?>\s*)?<svg\b/i.test(svg)) {
    throw invalidInputError("Unsafe HTML rejected: SVG data URL has no SVG root.");
  }
  if (/<!DOCTYPE\b|<!ENTITY\b/i.test(svg)) {
    throw invalidInputError("Unsafe HTML rejected: SVG document declarations are not allowed.");
  }
  if (/<\s*(?:script|iframe|object|embed|base|link|animate|animateMotion|animateTransform|discard|feImage|foreignObject|set)\b/i.test(svg)) {
    throw invalidInputError("Unsafe HTML rejected: active SVG data URL content is not allowed.");
  }
  if (/\s+on[a-z0-9_:-]+\s*=/i.test(svg) || /\s+srcdoc\s*=/i.test(svg)) {
    throw invalidInputError("Unsafe HTML rejected: active SVG data URL attributes are not allowed.");
  }
  const referencePattern = /\b(?:href|xlink:href|src)\s*=\s*(["'])(.*?)\1/gi;
  for (const reference of svg.matchAll(referencePattern)) {
    const target = String(reference[2] || "").trim().replace(/[\u0000-\u0020]+/g, "");
    if (
      target.startsWith("#")
      || /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(target)
    ) {
      continue;
    }
    throw invalidInputError("Unsafe HTML rejected: external SVG data URL references are not allowed.");
  }
  for (const cssUrl of svg.matchAll(/url\s*\(\s*(["']?)(.*?)\1\s*\)/gi)) {
    if (!String(cssUrl[2] || "").trim().startsWith("#")) {
      throw invalidInputError("Unsafe HTML rejected: external SVG data URL CSS references are not allowed.");
    }
  }
  if (/@import\b|expression\s*\(|-moz-binding\s*:/i.test(svg)) {
    throw invalidInputError("Unsafe HTML rejected: active SVG data URL CSS is not allowed.");
  }
}

module.exports = { assertSafeSvgDataUrlValue };
