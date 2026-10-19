import { collectionColumns } from '../../compression/style-first/index.js';
// Origin: public/yrkie-doe/core/contents-layout.js:9


export function itemColumns(props, width, count, gap) {
    const layout = props.itemLayout || props.content?.itemLayout || "auto";
    const requested = layout === "stack" ? 1 : layout === "grid"
      ? Number(props.itemColumns ?? props.content?.columns) || 3
      : Number(props.__autoItemColumns) || 3;
    return collectionColumns(width, requested, count, gap);
  }
