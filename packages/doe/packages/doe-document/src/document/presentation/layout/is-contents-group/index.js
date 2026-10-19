import { componentCategory as __doeFn_componentCategory } from '../component-category/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7177


export function isContentsGroup(node) {
    return node?.type === "layout-group" && (node.layout?.variant === "columns" ||
      Boolean(node.children?.length && node.children.every(child => child.type === "layout-group" ? (0, isContentsGroup)(child) : (0, __doeFn_componentCategory)(child) === "contents")));
  }
