// Origin: browser_snapshot.js::lucideIconSources
const { path } = require("../../environment/index.cjs");
const { lucideIconsRoot } = require("../../environment/index.cjs");
const { fs } = require("../../environment/index.cjs");

function lucideIconSources(fragment) {
  if (!/data-lucide\s*=/i.test(fragment)) return null;
  const names = new Set();
  const pattern = /data-lucide\s*=\s*["']([a-z0-9-]+)["']/gi;
  let match;
  while ((match = pattern.exec(fragment)) !== null) names.add(match[1].toLowerCase());

  const icons = {};
  for (const name of names) {
    const iconPath = path.join(lucideIconsRoot, "icons", `${name}.svg`);
    if (fs.existsSync(iconPath)) {
      icons[name] = { name, source: fs.readFileSync(iconPath, "utf8") };
    }
  }
  const fallbackName = "circle-help";
  const fallbackPath = path.join(lucideIconsRoot, "icons", `${fallbackName}.svg`);
  return {
    icons,
    fallback: {
      name: fallbackName,
      source: fs.readFileSync(fallbackPath, "utf8"),
    },
  };
}

module.exports = { lucideIconSources };
