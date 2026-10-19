// Origin: public/yrkie-doe/layout-engine/text-fields.js:148


export function plainText(target) {
    // Read author text, not innerText's CSS text-transform result (badges often
    // display uppercase). Plaintext-only editors insert BR/DIV on some engines.
    const walk = (node) => {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeName === "BR") return "\n";
      let text = "";
      for (const child of node.childNodes) {
        if (["DIV", "P"].includes(child.nodeName) && text && !text.endsWith("\n")) text += "\n";
        text += walk(child);
      }
      return text;
    };
    return walk(target).replace(/\r\n/g, "\n");
  }
