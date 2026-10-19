// Origin: browser_snapshot.js::injectExportStabilityStyles


function injectExportStabilityStyles(source) {
  if (/\bid=["']yrkie-export-stability-style["']/i.test(source)) return source;
  const style = `<style id="yrkie-export-stability-style">
html { scroll-behavior: auto !important; }
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}
</style>`;
  if (/<\/head>/i.test(source)) return source.replace(/<\/head>/i, `${style}</head>`);
  return `${style}${source}`;
}

module.exports = { injectExportStabilityStyles };
