// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5366


export function applyTextStyleAttributes(componentElement, node) {
    if (!["heading", "text"].includes(node.type)) return;
    const style = node.props?.textStyle;
    ["bold", "italic", "underline", "strikethrough"].forEach((key) => {
      const attribute = `text${key[0].toUpperCase()}${key.slice(1)}`;
      if (typeof style?.[key] === "boolean") {
        componentElement.dataset[attribute] = String(style[key]);
      } else {
        delete componentElement.dataset[attribute];
      }
    });
  }
