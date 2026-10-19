// Origin: browser_snapshot.js::decodeSvgDataUrl
const { invalidInputError } = require("../invalid-input-error/index.cjs");

function decodeSvgDataUrl(value) {
  const comma = value.indexOf(",");
  if (comma < 0) throw invalidInputError("Unsafe HTML rejected: malformed SVG data URL.");
  const metadata = value.slice(0, comma).toLowerCase();
  const encoded = value.slice(comma + 1);
  let decoded;
  try {
    if (metadata.includes(";base64")) {
      if (!/^[a-z0-9+/=\s]*$/i.test(encoded)) {
        throw new Error("invalid base64");
      }
      decoded = Buffer.from(encoded.replace(/\s+/g, ""), "base64").toString("utf8");
    } else {
      decoded = decodeURIComponent(encoded);
    }
  } catch (_error) {
    throw invalidInputError("Unsafe HTML rejected: malformed SVG data URL.");
  }
  if (Buffer.byteLength(decoded, "utf8") > 16 * 1024 * 1024) {
    throw invalidInputError("Unsafe HTML rejected: SVG data URL is too large.");
  }
  return decoded.replace(/^\uFEFF/, "");
}

module.exports = { decodeSvgDataUrl };
