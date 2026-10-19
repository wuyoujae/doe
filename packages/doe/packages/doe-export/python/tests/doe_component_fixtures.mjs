import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { registerHooks } from 'node:module';
// The frontend uses extensionless TypeScript imports; resolve them for Node's fixture reader.
registerHooks({ resolve(specifier, context, nextResolve) {
  try { return nextResolve(specifier, context); }
  catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    throw error;
  }
} });
const { STUDIO_PROTOTYPE_SCHEMAS_CHINESE } = await import('../../../../studio/studio-scenes/index.ts');
const { COMPONENT_DEFINITIONS } = await import('../../../doe-component/src/catalog/index.ts');

const publicRoot = process.env.YRKIE_SCHEMA_RENDERER_ROOT
  ? pathToFileURL(path.resolve(process.env.YRKIE_SCHEMA_RENDERER_ROOT) + path.sep)
  : new URL("../../../../../../test/20260909-doe-v2/runtime/yrkie-doe/", import.meta.url);
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('work-editor/component-gallery.js', publicRoot), 'utf8'), context);
const productionTypes = new Set(COMPONENT_DEFINITIONS.map(({ type }) => type));
const selected = new Set([
  'gallery-image-text', 'gallery-icon-text',
  'gallery-contents-five',
  'gallery-contents-chart',
  'gallery-contents-capabilities',
  'gallery-contents-icons',
  'gallery-contents-questions',
  'gallery-contents-columns',

  'gallery-item-cards-filled',
  'gallery-item-cards-filled-icon',
  'gallery-item-cards-outline',
  'gallery-item-cards-side-rule',
  'gallery-item-cards-top-rule',
  'gallery-item-cards-top-icon',
  'gallery-item-cards-connected',
  'gallery-item-cards-connected-icon',
  'gallery-item-cards-leaf',
  'gallery-item-cards-quote',
  'gallery-item-cards-bubble',
  'gallery-shape-contents-semicircle',
  'gallery-shape-contents-petals',
  'gallery-shape-contents-stairs',
  'gallery-shape-contents-pyramid',

  'gallery-content', 'gallery-code-block', 'gallery-ordered-list', 'gallery-todo-list', 'gallery-notice', 'gallery-columns-2', 'gallery-columns-3', 'gallery-columns-4', 'gallery-structured-content', 'gallery-kpi-media',
  'gallery-core-charts', 'gallery-advanced-charts', 'gallery-waterfall',
  'gallery-radar-donut', 'gallery-capability-cards',
  'gallery-numbered-icon-cards', 'gallery-data-table',
  'gallery-math-formula', 'gallery-animated-gif',
]);

function materialize(value) {
  if (Array.isArray(value)) return value.map(materialize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, materialize(item)]));
  if (typeof value === 'string' && value.startsWith('./assets/')) {
    const path = fileURLToPath(new URL(`work-editor/${value}`, publicRoot));
    return `data:image/png;base64,${fs.readFileSync(path).toString('base64')}`;
  }
  return value;
}

const scenes = [...STUDIO_PROTOTYPE_SCHEMAS_CHINESE, ...context.window.SlideDemoSchemas]
  .filter(({ id }) => selected.has(id)).map(materialize);
vm.runInNewContext(fs.readFileSync(new URL('core/contents-model.js', publicRoot), 'utf8'), context);
for (const choice of context.window.DOEContentsModel.CHOICES) {
  const props = { items: Array.from({length: 3}, (_, index) => ({title: `Stage ${index + 1}`, text: 'Details', icon: 'Target'})) };
  if (choice.id === 'quotation') props.items.forEach(item => { delete item.title; item.source = 'Author'; });
  const source = choice.id === 'quotation'
    ? { id: 'contents', type: 'contents', props: {...props, presentation: 'quotation', items: props.items.map((item, index) => ({...item, id: `entry-${index}`}))} }
    : { id: 'contents', type: 'item-cards', props };
  const block = context.window.DOEContentsModel.replace(source, choice.id);
  scenes.push({id: `contents-${choice.id}`, schema: {slide: {id: `contents-${choice.id}`, size: {width:960,height:540,unit:'pt'}, blocks: [block]}}});
}
process.stdout.write(JSON.stringify({ types: [...productionTypes], scenes }));
