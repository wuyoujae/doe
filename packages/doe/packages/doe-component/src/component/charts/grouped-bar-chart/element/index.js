// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:15


export function element(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
