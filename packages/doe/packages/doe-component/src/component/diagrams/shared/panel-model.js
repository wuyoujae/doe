export function identify(items) {
  const used=new Set(items.map(item=>item.id));
  return items.map((item,index)=>{let id=item.id||`diagram-node-${index}`;while(!item.id&&used.has(id))id+='-';used.add(id);return {...item,id};});
}
export function reconcilePanelEdit(node,props) {
  const old=identify(node.props.items);
  if(!node.textOverrides)return;
  node.textOverrides=node.textOverrides.flatMap(entry=>{
    if(entry.path[0]!=='items')return [entry];
    const before=old[entry.path[1]],index=props.items.findIndex(item=>item.id===before?.id);
    return index<0||props.items[index][entry.path[2]]!==before?.[entry.path[2]]?[]:[{...entry,path:['items',index,...entry.path.slice(2)]}];
  });
  if(!node.textOverrides.length)delete node.textOverrides;
}
