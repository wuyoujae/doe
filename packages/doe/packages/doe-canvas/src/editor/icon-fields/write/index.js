// Origin: public/yrkie-doe/layout-engine/icon-fields.js:37


export function write(props, path, value) {
    let parent = props;
    for (const key of path.slice(0, -1)) parent = parent[key] || (parent[key] = {});
    parent[path.at(-1)] = value;
  }
