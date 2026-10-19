import { groupingCollection, canonicalizeGroupingCollection, adaptGroupingItem } from '../../../../../../doe-component/src/component/contents/contents/model/grouping/index.js';
import { isLayoutFeatureLocked } from '../../layout/is-layout-feature-locked/index.js';
import { isEdgeSplitGroup } from '../../layout/is-edge-split-group/index.js';

const copy = value => JSON.parse(JSON.stringify(value));
const fail = message => { throw new Error(message); };
const group = node => node?.type === 'layout-group';
const protectedNode = node => isEdgeSplitGroup(node) || ['content', 'media'].includes(node?.layout?.region);
function locate(list, id, parents = []) {
  for (let index = 0; index < list.length; index++) {
    const node = list[index];
    if (node.id === id) return { node, list, index, parents, parent: parents.at(-1) };
    const found = node.children && locate(node.children, id, [...parents, node]);
    if (found) return found;
  }
  return null;
}
function editable(location) {
  if (protectedNode(location.node)) fail('贴边图片区与安全区边界不参与拆合');
  if ([...location.parents, location.node].some(node => isLayoutFeatureLocked(node, 'structure'))) fail('此组件或父组已锁定结构');
  if (location.parents.some(node => node.layout?.region === 'media')) fail('贴边图片不参与拆合');
}
function region(location) {
  const edge = location.parents.find(isEdgeSplitGroup);
  if (!edge) return null;
  const content = location.parents.find(node => node.layout?.region === 'content');
  if (!content) fail('只能操作安全区内部的内容');
  return content.id;
}
function itemIndex(contract, reference) {
  const index = reference.itemId != null ? contract.items.findIndex(item => item?.id === reference.itemId) : reference.index;
  if (!Number.isInteger(index) || index < 0 || index >= contract.items.length) fail('内容项已变化，请重新拖动');
  return index;
}
function validate(list, depth = 0, ids = new Set()) {
  for (const node of list) {
    if (ids.has(node.id)) fail('组件标识重复');
    ids.add(node.id);
    if (ids.size > 2048) fail('页面组件数量超过上限');
    if (group(node)) {
      if (depth >= 3) fail('组合最多嵌套 3 层');
      if (node.children.length > 24) fail('组合超过最多 24 个成员');
      validate(node.children, depth + 1, ids);
    }
    const collection = groupingCollection(node);
    if (collection && (collection.items.length < collection.choice.min || collection.items.length > collection.choice.max)) {
      fail(`${collection.choice.label}需要 ${collection.choice.min}–${collection.choice.max} 个内容项`);
    }
    if (collection) {
      const keys = collection.items.map(item => item?.id).filter(Boolean);
      if (new Set(keys).size !== keys.length) fail('内容项标识重复');
      for (const item of collection.items) for (const key of collection.choice.required) {
        if (['src', 'icon'].includes(key) && item[key] === '') continue;
        if (!String(item[key] ?? '').trim()) fail(`${collection.choice.label}需要${key === 'title' ? '标题' : key === 'text' ? '正文' : key}，请先补充内容`);
      }
    }
  }
}

/** Pure atomic tree operation. A failed candidate never mutates its input. */
export function reduceGrouping(blocks, intent, newId = () => `group-${globalThis.crypto.randomUUID()}`) {
  if (!['top', 'bottom', 'left', 'right'].includes(intent.edge)) fail('无效拖动落点');
  const next = copy(blocks), source = locate(next, intent.source.blockId), target = locate(next, intent.target.blockId);
  if (!source || !target) fail('拖动对象已变化，请重新拖动');
  const reservedIds = new Set();
  const reserve = nodes => nodes.forEach(node => {
    reservedIds.add(node.id); groupingCollection(node)?.items.forEach(item => { if (item?.id) reservedIds.add(item.id); });
    if (node.children) reserve(node.children);
  });
  reserve(next);
  const allocate = () => { let id; do { id = newId(); } while (reservedIds.has(id)); reservedIds.add(id); return id; };
  editable(source); editable(target);
  if (region(source) !== region(target)) fail('不能跨越贴边布局的安全区边界');
  const sourceIsItem = intent.source.index != null || intent.source.itemId != null;
  const targetIsItem = intent.target.index != null || intent.target.itemId != null;
  if (!sourceIsItem && target.parents.some(node => node.id === source.node.id)) fail('不能把组合放进自身的子项');
  if (!sourceIsItem && source.node.id === target.node.id) return { changed: false };
  const before = ['top', 'left'].includes(intent.edge), horizontal = ['left', 'right'].includes(intent.edge);
  const sourceCollection = groupingCollection(source.node), targetCollection = groupingCollection(target.node);
  if (targetIsItem && (!sourceIsItem || !targetCollection)) fail('这里只接纳 Contents 内容项');
  if (sourceIsItem && !sourceCollection) fail('此组件不支持拆分内容项');
  for (const [ref, collection] of [[intent.source, sourceCollection], [intent.target, targetCollection]]) {
    if (ref.snapshot !== undefined && JSON.stringify(collection?.items[itemIndex(collection, ref)]) !== ref.snapshot) fail('内容项已变化，请重新拖动');
  }

  const origins = new Map(), oldOverrides = new Map(), cleanupIds = new Set(source.parents.map(node => node.id));
  const touched = new Set();
  function prepare(node) {
    if (touched.has(node.id)) return groupingCollection(node);
    touched.add(node.id);
    const old = groupingCollection(node), original = locate(blocks, node.id)?.node;
    oldOverrides.set(node.id, original?.textOverrides || []);
    const contract = canonicalizeGroupingCollection(node);
    contract.items.forEach((item, index) => {
      if (!item.id) {
        const fallback = `${node.id}-item-${index + 1}`;
        item.id = reservedIds.has(fallback) ? allocate() : fallback;
        reservedIds.add(item.id);
      }
      origins.set(item, { blockId: node.id, path: [...old.path, index], scalar: typeof old.items[index] === 'string', fields: null });
    });
    return contract;
  }
  let moved = source.node, selectedId, selectedItem = null, kind = 'reorder', compressionIds = [];
  if (sourceIsItem && targetIsItem) {
    const from = prepare(source.node), to = prepare(target.node);
    const fromIndex = itemIndex(from, intent.source), toIndex = itemIndex(to, intent.target);
    if (source.node.id === target.node.id && (fromIndex === toIndex || fromIndex === toIndex + (before ? -1 : 1))) return { changed: false };
    const anchor = to.items[toIndex], [value] = from.items.splice(fromIndex, 1);
    const converted = source.node === target.node ? { item: value, fields: null } : adaptGroupingItem(value, to.choice);
    if (to.items.some(item => item.id === converted.item.id)) converted.item.id = allocate();
    origins.set(converted.item, { ...origins.get(value), fields: converted.fields, offsets: converted.offsets });
    to.items.splice(to.items.indexOf(anchor) + (before ? 0 : 1), 0, converted.item);
    if (!from.items.length && source.node !== target.node) source.list.splice(source.index, 1);
    selectedId = target.node.id;
    selectedItem = { blockId: selectedId, key: `id:${converted.item.id}`, index: to.items.indexOf(converted.item) };
    kind = source.node === target.node ? 'reorder' : 'transfer-item';
    compressionIds = [selectedId];
  } else {
    if (sourceIsItem) {
      const contract = prepare(source.node), index = itemIndex(contract, intent.source);
      if (contract.choice.min > 1) fail(`${contract.choice.label}最少需要 ${contract.choice.min} 项，不能拆成单项组件`);
      if (contract.items.length === 1) {
        source.list.splice(source.index, 1);
      } else {
        const [item] = contract.items.splice(index, 1);
        moved = { ...copy(source.node), id: allocate(), props: { ...copy(source.node.props), items: [item] } };
        delete moved.textOverrides;
        delete moved.layout?.span;
        touched.add(moved.id);
      }
    } else {
      if (source.list === target.list && !horizontal && (source.index === target.index + (before ? -1 : 1))) return { changed: false };
      if (source.parent && source.parent === target.parent && source.index === target.index + (before ? -1 : 1)) return { changed: false };
      source.list.splice(source.index, 1);
    }
    if (sourceIsItem && moved === source.node && source.node.id === target.node.id) return { changed: false };
    const anchor = locate(next, target.node.id);
    if (!anchor) fail('目标已经不在页面中');
    const sameParent = !sourceIsItem && source.parent && source.parent === target.parent;
    if (horizontal && !sameParent) {
      const container = { id: allocate(), type: 'layout-group', layout: { variant: 'columns', columns: 2, origin: 'explicit', intent: 'drag-compose' }, children: before ? [moved, anchor.node] : [anchor.node, moved] };
      anchor.list.splice(anchor.index, 1, container);
      selectedId = container.id; compressionIds = [container.id]; kind = 'compose';
    } else {
      anchor.list.splice(anchor.index + (before ? 0 : 1), 0, moved);
      selectedId = moved.id; compressionIds = [moved.id];
      kind = sourceIsItem || source.parents.some(node => node.id === target.node.id) ? 'detach' : 'reorder';
    }
    if (sourceIsItem && kind !== 'compose') selectedItem = { blockId: moved.id, key: `id:${moved.props.items[0].id}`, index: 0 };
  }

  const collapsed = [];
  function collapse(list) {
    for (let index = list.length - 1; index >= 0; index--) {
      const node = list[index];
      if (!group(node)) continue;
      collapse(node.children);
      if (!cleanupIds.has(node.id) || protectedNode(node) || node.children.length > 1) continue;
      const child = node.children[0];
      if (child) collapsed.push({ id: node.id, childId: child.id });
      if (child && node.layout?.span != null) child.layout = { ...child.layout, span: node.layout.span };
      list.splice(index, 1, ...(child ? [child] : []));
    }
  }
  collapse(next);
  validate(next);
  const transfers = [];
  function remap(list) {
    for (const node of list) {
      if (touched.has(node.id)) {
        const collection = groupingCollection(node);
        const overrides = [];
        collection.items.forEach((item, index) => {
          const origin = origins.get(item);
          if (!origin) return;
          const destination = { blockId: node.id, path: [...collection.path, index] };
          transfers.push({ ...origin, ...{ destination } });
          for (const entry of oldOverrides.get(origin.blockId) || []) {
            if (!origin.path.every((part, i) => entry.path[i] === part)) continue;
            let rest = entry.path.slice(origin.path.length);
            if (origin.scalar) rest = ['text', ...rest];
            if (origin.fields && !origin.fields[rest[0]]) continue;
            const merged = origin.offsets && Object.hasOwn(origin.offsets, rest.join('.'));
            const suffix = origin.fields ? [origin.fields[rest[0]], ...(merged ? [] : rest.slice(1))] : rest;
            const path = [...destination.path, ...suffix];
            if (merged) {
              const existing = overrides.find(value => JSON.stringify(value.path) === JSON.stringify(path));
              const offset = origin.offsets[rest.join('.')];
              const runs = (entry.runs || []).map(run => ({ ...run, start: run.start + offset, end: run.end + offset }));
              if (existing) existing.runs = [...existing.runs, ...runs].sort((a, b) => a.start - b.start);
              else overrides.push({ path, text: item[suffix[0]], runs });
            } else overrides.push({ ...entry, path });
          }
        });
        const collectionWide = (oldOverrides.get(node.id) || []).filter(entry => !['items', 'content'].includes(entry.path[0]));
        if (overrides.length || collectionWide.length) node.textOverrides = [...collectionWide, ...overrides];
        else delete node.textOverrides;
      }
      if (node.children) remap(node.children);
    }
  }
  remap(next);
  if (JSON.stringify(next) === JSON.stringify(blocks)) return { changed: false };
  return { changed: true, blocks: next, selectedId, selectedItem, kind, compressionIds, transfers, collapsed };
}
