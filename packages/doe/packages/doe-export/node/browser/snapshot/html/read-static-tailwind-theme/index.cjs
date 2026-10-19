// Origin: browser_snapshot.js::readStaticTailwindTheme
const { extractStaticConfigObject } = require("../extract-static-config-object/index.cjs");

function readStaticTailwindTheme(configSources) {
  const colors = {};
  const fontFamily = {};
  const colorPattern = /["']([a-z0-9_-]{1,64})["']\s*:\s*["'](#[0-9a-f]{3,8})["']/gi;
  const fontPattern = /["']([a-z0-9_-]{1,64})["']\s*:\s*\[([^\]]{1,2048})\]/gi;
  const fontValuePattern = /["']([^"'\\\r\n]{1,128})["']/g;
  for (const configSource of configSources) {
    const colorSource = extractStaticConfigObject(configSource, "colors");
    let match;
    while ((match = colorPattern.exec(colorSource)) !== null) colors[match[1]] = match[2];

    const fontSource = extractStaticConfigObject(configSource, "fontFamily");
    while ((match = fontPattern.exec(fontSource)) !== null) {
      const families = [];
      let familyMatch;
      while ((familyMatch = fontValuePattern.exec(match[2])) !== null) {
        families.push(familyMatch[1]);
      }
      if (families.length) fontFamily[match[1]] = families;
    }
  }
  return { colors, fontFamily };
}

module.exports = { readStaticTailwindTheme };
