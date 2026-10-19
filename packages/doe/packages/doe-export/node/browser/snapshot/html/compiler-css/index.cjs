// Origin: browser_snapshot.js::compilerCss


function compilerCss(width, height) {
  return `
html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: ${width}px !important;
  height: ${height}px !important;
  overflow: hidden !important;
  background: transparent !important;
}
#slide-content {
  position: relative !important;
  width: ${width}px !important;
  height: ${height}px !important;
  overflow: hidden !important;
  box-shadow: none !important;
}
*, *::before, *::after {
  transition: none !important;
}
`;
}

module.exports = { compilerCss };
