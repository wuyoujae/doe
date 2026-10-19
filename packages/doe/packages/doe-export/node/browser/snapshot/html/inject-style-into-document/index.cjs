// Origin: browser_snapshot.js::injectStyleIntoDocument


function injectStyleIntoDocument(source, style) {
  if (/<\/head\s*>/i.test(source)) {
    return source.replace(/<\/head\s*>/i, `${style}\n</head>`);
  }
  return `${style}\n${source}`;
}

module.exports = { injectStyleIntoDocument };
