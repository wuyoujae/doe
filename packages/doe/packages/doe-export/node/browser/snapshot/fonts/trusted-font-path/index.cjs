// Origin: browser_snapshot.js::trustedFontPath
const { path } = require("../../environment/index.cjs");
const { frontendPublicRoot } = require("../../environment/index.cjs");
const { fs } = require("../../environment/index.cjs");

function trustedFontPath(cssPath, authoredUrl) {
  const withoutQuery = authoredUrl.split(/[?#]/, 1)[0];
  const candidate = withoutQuery.startsWith("/")
    ? path.resolve(frontendPublicRoot, `.${withoutQuery}`)
    : path.resolve(path.dirname(cssPath), withoutQuery);
  const relative = path.relative(frontendPublicRoot, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Traditional Slide font escaped the trusted public root: ${authoredUrl}`);
  }
  if (!fs.existsSync(candidate)) throw new Error(`Traditional Slide font is unavailable: ${candidate}`);
  return candidate;
}

module.exports = { trustedFontPath };
