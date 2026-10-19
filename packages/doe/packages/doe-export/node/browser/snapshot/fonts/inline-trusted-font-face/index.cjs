// Origin: browser_snapshot.js::inlineTrustedFontFace
const { trustedFontPath } = require("../trusted-font-path/index.cjs");
const { trustedFontBinaryCache } = require("../../environment/index.cjs");
const { path } = require("../../environment/index.cjs");
const { fs } = require("../../environment/index.cjs");

function inlineTrustedFontFace({ block, cssPath }) {
  return block.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (_match, _quote, authoredUrl) => {
    const fontPath = trustedFontPath(cssPath, authoredUrl.trim());
    let dataUrl = trustedFontBinaryCache.get(fontPath);
    if (!dataUrl) {
      const extension = path.extname(fontPath).toLowerCase();
      const mediaType = extension === ".woff2"
        ? "font/woff2"
        : extension === ".ttf"
          ? "font/ttf"
          : extension === ".otf"
            ? "font/otf"
            : "font/woff";
      dataUrl = `data:${mediaType};base64,${fs.readFileSync(fontPath).toString("base64")}`;
      trustedFontBinaryCache.set(fontPath, dataUrl);
    }
    return `url("${dataUrl}")`;
  });
}

module.exports = { inlineTrustedFontFace };
