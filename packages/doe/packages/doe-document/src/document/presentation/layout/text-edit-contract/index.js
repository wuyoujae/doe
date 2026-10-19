// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5313


export function textEditContract(node) {
    if (node.type === "heading") {
      return {
        prop: "text",
        selector: ".component-heading",
        label: "标题文字",
      };
    }
    if (node.type === "text") {
      return {
        prop: "text",
        selector: ".component-text__body",
        label: "正文文字",
      };
    }
    return null;
  }
