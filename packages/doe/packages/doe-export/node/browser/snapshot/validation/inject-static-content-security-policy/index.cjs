// Origin: browser_snapshot.js::injectStaticContentSecurityPolicy
const { staticContentSecurityPolicy } = require("../../environment/index.cjs");

function injectStaticContentSecurityPolicy(source) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${staticContentSecurityPolicy}">`;
  if (/<head\b[^>]*>/i.test(source)) {
    return source.replace(/<head\b[^>]*>/i, (match) => `${match}${meta}`);
  }
  return `${meta}\n${source}`;
}

module.exports = { injectStaticContentSecurityPolicy };
