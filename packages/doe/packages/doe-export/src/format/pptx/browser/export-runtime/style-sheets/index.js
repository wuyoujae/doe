// Origin: public/yrkie-doe/export-runtime/export-runtime.js:114


export function styleSheets() {
    return Array.from(document.styleSheets).map((sheet) => {
      let css = "";
      try {
        css = Array.from(sheet.cssRules || []).map((rule) => rule.cssText).join("\n");
      } catch (_error) {
        css = "";
      }
      return { href: sheet.href || document.baseURI, css };
    }).filter((sheet) => sheet.css);
  }
