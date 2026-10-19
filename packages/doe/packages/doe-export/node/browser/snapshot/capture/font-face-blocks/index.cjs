// Origin: browser_snapshot.js::fontFaceBlocks
const fs = require("node:fs");

function fontFaceBlocks(cssPath) {
  if (!fs.existsSync(cssPath)) {
    throw new Error(`Traditional Slide font CSS is unavailable: ${cssPath}`);
  }
  const css = fs.readFileSync(cssPath, "utf8");
  return Array.from(css.matchAll(/@font-face\s*\{[\s\S]*?\}/gi), (match) => ({
    block: match[0],
    cssPath,
  }));
}

module.exports = { fontFaceBlocks };
