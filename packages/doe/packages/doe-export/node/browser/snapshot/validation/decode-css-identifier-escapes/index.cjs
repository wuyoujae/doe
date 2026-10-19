// Origin: browser_snapshot.js::decodeCssIdentifierEscapes


function decodeCssIdentifierEscapes(value) {
  return String(value || "").replace(
    /\\(?:([0-9a-f]{1,6})(?:[\t\n\f\r ]|\r\n)?|([^\n\r\f]))/gi,
    (_match, hexadecimal, escaped) => {
      if (!hexadecimal) return escaped || "";
      const codepoint = Number.parseInt(hexadecimal, 16);
      if (!Number.isFinite(codepoint) || codepoint <= 0 || codepoint > 0x10ffff) return "\ufffd";
      return String.fromCodePoint(codepoint);
    },
  );
}

module.exports = { decodeCssIdentifierEscapes };
