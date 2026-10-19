// Origin: browser_snapshot.js::assertNoUnsupportedAuthoredCssImageFunctions
const { hasUnsupportedCssImageFunction } = require("../has-unsupported-css-image-function/index.cjs");
const { invalidInputError } = require("../invalid-input-error/index.cjs");

function assertNoUnsupportedAuthoredCssImageFunctions(source) {
  const markup = String(source || "");
  for (const match of markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
    if (hasUnsupportedCssImageFunction(match[1])) {
      throw invalidInputError("Unsafe HTML rejected: unsupported CSS image function.");
    }
  }
  for (const match of markup.matchAll(/\sstyle\s*=\s*(?:\"([^\"]*)\"|'([^']*)')/gi)) {
    const htmlCodepoint = (digits, radix) => {
      const codepoint = Number.parseInt(digits, radix);
      return Number.isFinite(codepoint) && codepoint > 0 && codepoint <= 0x10ffff
        ? String.fromCodePoint(codepoint)
        : "\ufffd";
    };
    const value = String(match[1] || match[2] || "")
      .replace(/&#x([0-9a-f]+);?/gi, (_item, digits) => htmlCodepoint(digits, 16))
      .replace(/&#([0-9]+);?/g, (_item, digits) => htmlCodepoint(digits, 10))
      .replace(/&colon;?/gi, ":")
      .replace(/&lpar;?/gi, "(")
      .replace(/&bsol;?/gi, "\\")
      .replace(/&amp;?/gi, "&");
    if (hasUnsupportedCssImageFunction(value)) {
      throw invalidInputError("Unsafe HTML rejected: unsupported CSS image function.");
    }
  }
}

module.exports = { assertNoUnsupportedAuthoredCssImageFunctions };
