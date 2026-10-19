// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5789


export function setItemCollectionValues(node, definition, value, order = null) {
    const keys = String(definition.itemCollection?.path || "items")
      .split(".")
      .filter(Boolean);
    if (!keys.length) return false;
    let target = node.props;
    keys.slice(0, -1).forEach((key) => {
      if (!target[key] || typeof target[key] !== "object") target[key] = {};
      target = target[key];
    });
    const previous=target[keys[keys.length-1]];
    if(Array.isArray(previous)&&node.textOverrides) {
      const used=new Set();
      const indices=order||value.map(item=>{const index=previous.findIndex((old,i)=>!used.has(i)&&(old===item||(item?.id&&old?.id===item.id)));if(index>=0)used.add(index);return index;});
      node.textOverrides=node.textOverrides.flatMap(entry=>{
        if(!keys.every((key,i)=>entry.path[i]===key)||!Number.isInteger(entry.path[keys.length]))return [entry];
        const index=indices.indexOf(entry.path[keys.length]);
        return index<0?[]:[{...entry,path:[...keys,index,...entry.path.slice(keys.length+1)]}];
      });
      if(!node.textOverrides.length)delete node.textOverrides;
    }
    if (definition.prepareItemCollection && Array.isArray(previous)) value = definition.prepareItemCollection(value, previous, order);
    target[keys[keys.length - 1]] = value;
    return true;
  }
