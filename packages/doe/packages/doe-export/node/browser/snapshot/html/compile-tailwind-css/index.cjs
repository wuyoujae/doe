// Origin: browser_snapshot.js::compileTailwindCss
const { postcss } = require("../../environment/index.cjs");
const { tailwindcss } = require("../../environment/index.cjs");

async function compileTailwindCss(fragment, themeExtend = {}) {
  const result = await postcss([
    tailwindcss({
      content: [{ raw: fragment, extension: "html" }],
      corePlugins: { preflight: true },
      theme: { extend: themeExtend },
    }),
  ]).process("@tailwind base; @tailwind components; @tailwind utilities;", { from: undefined });
  return result.css;
}

module.exports = { compileTailwindCss };
