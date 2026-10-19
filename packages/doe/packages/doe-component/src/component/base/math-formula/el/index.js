// Origin: public/yrkie-doe/components/math-formula/math-formula.js:767


export function el(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
