export const MAX_NODES = 40;
export const MAX_LEVEL = 5;
export const MAX_BRANCHES = 6;

export function identifiedItems(items) {
  const used = new Set(items.map(item => item.id).filter(Boolean));
  return items.map((item, index) => {
    if (item.id) return { ...item };
    let id = `mind-original-${index}`;
    while (used.has(id)) id += '-';
    used.add(id); return { ...item, id };
  });
}

export function reconcileTextOverrides(node, props) {
  if (!node.textOverrides) return;
  const old = identifiedItems(node.props.content.items), next = props.content.items;
  node.textOverrides = node.textOverrides.flatMap(entry => {
    if (entry.path[0] !== 'content' || entry.path[1] !== 'items') return [entry];
    const index = next.findIndex(item => item.id === old[entry.path[2]]?.id);
    if (index < 0 || next[index][entry.path[3]] !== old[entry.path[2]][entry.path[3]]) return [];
    return [{ ...entry, path: ['content', 'items', index, ...entry.path.slice(3)] }];
  });
  if (!node.textOverrides.length) delete node.textOverrides;
}

export function treeError(items) {
  if (!Array.isArray(items) || !items.length || items.length > MAX_NODES) return '需要 1–40 个节点';
  if (items[0]?.level !== 0) return '第一个节点必须是 level=0 的根节点';
  let branches = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || !Number.isInteger(item.level) || item.level < (i ? 1 : 0) || item.level > MAX_LEVEL || i && item.level > items[i - 1].level + 1) return '层级需连续，子节点紧跟父节点，最多六层';
    if (item.level === 1 && ++branches > MAX_BRANCHES) return '根节点下最多六个分支';
    if (typeof item.title !== 'string' || !item.title.trim() || typeof item.text !== 'string' || !item.text.trim()) return '每个节点都需要标题和描述';
  }
  return '';
}

export function treeNodes(items) {
  const nodes = items.map((item, index) => ({ item, index, children: [], parent: null })), stack = [];
  nodes.forEach(node => {
    stack.length = node.item.level;
    node.parent = stack.at(-1) || null;
    node.parent?.children.push(node);
    stack.push(node);
  });
  return nodes;
}
export function branchEnd(items, index) {
  let end = index + 1;
  while (end < items.length && items[end].level > items[index].level) end++;
  return end;
}
export function editTree(items, index, action, defaults = { title: 'Title', text: 'Description' }) {
  const next = structuredClone(items), end = branchEnd(next, index), node = treeNodes(next)[index];
  const siblings = node.parent?.children || [], position = siblings.findIndex(n => n.index === index);
  if (action === 'add' && next.length < MAX_NODES && node.item.level < MAX_LEVEL) {
    let serial = next.length + 1;
    while (next.some(item => item.id === `mind-node-${serial}`)) serial++;
    next.splice(end, 0, { id: `mind-node-${serial}`, level: node.item.level + 1, title: defaults.title, text: defaults.text, icon: 'User' });
  } else if (action === 'delete' && index > 0) next.splice(index, end - index);
  else if (action === 'up' && position > 0) {
    const branch = next.splice(index, end - index); next.splice(siblings[position - 1].index, 0, ...branch);
  } else if (action === 'down' && position >= 0 && position < siblings.length - 1) {
    const destination = branchEnd(next, siblings[position + 1].index), branch = next.splice(index, end - index);
    next.splice(destination - branch.length, 0, ...branch);
  } else if (action === 'indent' && position > 0) next.slice(index, end).forEach(item => item.level++);
  else if (action === 'outdent' && node.item.level > 1) {
    const destination = branchEnd(next, node.parent.index), branch = next.splice(index, end - index);
    branch.forEach(item => item.level--); next.splice(destination - branch.length, 0, ...branch);
  } else return null;
  return treeError(next) ? null : next;
}
