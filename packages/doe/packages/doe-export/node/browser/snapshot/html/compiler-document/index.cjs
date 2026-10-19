// Origin: browser_snapshot.js::compilerDocument
const { staticContentSecurityPolicy } = require("../../environment/index.cjs");
const { runtimeCss } = require("../../environment/index.cjs");
const { compilerCss } = require("../compiler-css/index.cjs");
const { canonicalFragmentCss } = require("../../environment/index.cjs");

function compilerDocument(fragment, generatedCss, fontCss, width, height) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${staticContentSecurityPolicy}">
  <style id="slide-runtime-css">${runtimeCss}\n${fontCss}\n${compilerCss(width, height)}\n${canonicalFragmentCss}</style>
  <style id="slide-tailwind-css">${generatedCss}</style>
</head>
<body><main id="slide-content">${fragment}</main></body>
</html>`;
}

module.exports = { compilerDocument };
