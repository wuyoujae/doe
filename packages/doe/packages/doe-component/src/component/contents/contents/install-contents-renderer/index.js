import { itemIconFields } from '../../../../shared/item-icon/index.js';
import { paintEmptyIcon } from '../../media-placeholder/index.js';
import { directionalProcessHeader } from '../../process-headers/orientation.js';
import { presentation as numbered_parallelogram } from '../../numbered-parallelogram/definition/index.js';
import { presentation as numbered_pill } from '../../numbered-pill/definition/index.js';
import { presentation as numbered_chevron } from '../../numbered-chevron/definition/index.js';
import { presentation as ascending_bar } from '../../ascending-bar/definition/index.js';
import { presentation as ascending_arrow } from '../../ascending-arrow/definition/index.js';
import { presentation as ascending_numbered } from '../../ascending-numbered/definition/index.js';
import { ascendingColumnOrder } from '../../process-headers/columns/index.js';
import { metricColumnOrder, metricProps, metricsPresentation } from '../../metrics/index.js';
import { dotCardPresentation } from '../../dot-card/definition/index.js';
import { dotListPresentation } from '../../dot-list/definition/index.js';
import { numberedTopRulePresentation } from '../../numbered-top-rule/definition/index.js';
import { numberedInlinePresentation } from '../../numbered-inline/definition/index.js';
import { timelineNumberedPresentation } from '../../timeline-numbered/definition/index.js';
import { timelineDotsPresentation } from '../../timeline-dots/definition/index.js';
import { timelineDotCardsPresentation } from '../../timeline-dot-cards/definition/index.js';
import { alternatingPresentation } from '../../alternating/definition/index.js';
import { iconHorizontalPresentation } from '../../icon-horizontal/definition/index.js';
import { collectionColumnOrder, collectionColumns } from '../../../../layout/compression/style-first/index.js';
import { resolveComponentFlowContract } from '../../../../layout/flow/contract.js';
import { imageCardControls, imageCardProps, imageCardContentWidth } from '../../media-text/image-options.js';
// Origin: public/yrkie-doe/components/contents/contents.js:4
import { scope as __doeScope } from "../runtime/context/index.js";

export function installContentsRenderer(runtime) {
        const engine = runtime.SlideEngine;
        if (engine.components.has(__doeScope.CONTENTS_TYPE))
            return;
        const cards = engine.components.get('item-cards');
        const presentations = { 'numbered-parallelogram': numbered_parallelogram(cards), 'numbered-pill': numbered_pill(cards), 'numbered-chevron': numbered_chevron(cards), 'ascending-bar': ascending_bar(cards), 'ascending-arrow': ascending_arrow(cards), 'ascending-numbered': ascending_numbered(cards), alternating: alternatingPresentation(cards), 'icon-horizontal': iconHorizontalPresentation(cards), 'dot-card': dotCardPresentation(cards), 'dot-list': dotListPresentation(cards), 'numbered-top-rule': numberedTopRulePresentation(cards), 'numbered-inline': numberedInlinePresentation(cards), 'timeline-numbered': timelineNumberedPresentation(cards), 'timeline-dots': timelineDotsPresentation(cards), 'timeline-dot-cards': timelineDotCardsPresentation(cards) };
        presentations.metrics = metricsPresentation(cards, engine.components.get('stat'));
        const choiceFor = (props) => __doeScope.CHOICES.find(choice => choice.id === (props.presentation === 'bullets' ? 'list:unordered' : props.presentation));
        const projected = (node) => {
            const choice = choiceFor(node.props);
            // Retired collection headings must not reach native list/card renderers.
            const { title: _title, ...contentProps } = node.props;
            const props = { ...contentProps, variant: choice.variant };
            if (choice.id.startsWith('list:'))
                props.items = props.items.map(item => item.text || '');
            if (['capability-cards', 'numbered-icon-cards'].includes(choice.type))
                props.content = { items: props.items };
            return { ...node, type: choice.type, props };
        };
        const definitionFor = (props) => presentations[choiceFor(props)?.id] || engine.components.get(choiceFor(props)?.type) || cards;
        const isList = props => choiceFor(props)?.id.startsWith('list:');
        const isSimple = (props) => ['image-text', 'icon-text', 'columns', 'question-card', 'quote'].includes(choiceFor(props).type);
        function clean(root, props) {
            const choice = choiceFor(props);
            root.dataset.contentsPresentation = choice.id;
            root.querySelectorAll('.item-cards__item').forEach((entry, index) => {
                if ((!choice.icons || !Object.hasOwn(props.items[index] || {}, 'icon')) && choice.id !== 'cards:connected-icon' && !props.items[index]?.icon)
                    entry.querySelector('.item-cards__icon')?.remove();
            });
            if (choice.icons) root.querySelectorAll('[data-collection-item-index]').forEach(entry => {
                const index = Number(entry.dataset.collectionItemIndex);
                entry.querySelectorAll('.item-cards__icon, .base-media__icon, .ppt-capability-cards__icon, .ppt-numbered-icon-cards__badge').forEach(box => {
                    const owner = Number(box.dataset.connectorIconIndex ?? index);
                    if (props.items[owner]?.icon === '') paintEmptyIcon(box);
                });
            });
            root.querySelectorAll('.item-cards__title, .item-cards__text, .shape-contents__title, .shape-contents__text').forEach(field => {
                field.hidden = !field.textContent?.trim();
            });
        }
        engine.registerComponent(__doeScope.CONTENTS_TYPE, {
            ...cards,
            category: 'contents',
            resolveCategory(props) { return choiceFor(props)?.category || 'contents'; },
            resolveFlowLayout(props) {
                const definition = definitionFor(props), choice = choiceFor(props);
                const timeline = choice.id === 'alternating' || choice.id.startsWith('timeline-');
                const tracks = props.staggered !== false && choice.id.startsWith('timeline-')
                    ? (props.items.length + 1) / 2 : props.items.length;
                return { ...resolveComponentFlowContract(definition, { ...props, variant: choice.variant }),
                    surfaceScale: timeline || choice.type === 'shape-contents' ? 'uniform' : 'reflow',
                    ...(timeline ? { compression: 'graphic' } : choice.id === 'metrics' ? { compression: 'text' } : {}),
                    ...(timeline ? { alignX: 'center' } : {}),
                    ...(timeline && props.orientation === 'horizontal' ? { minimumNaturalWidth: tracks * cards.columnMinWidth } : {}),
                };
            },
            reflow(root, node, context) {
                const definition = definitionFor(node.props);
                definition.reflow?.(root, projected(node), context);
            },
            editorControls: undefined,
            resolveEditorControls(props) { return choiceFor(props)?.id === 'image-text' ? imageCardControls : undefined; },
            itemCollection: { ...cards.itemCollection, showLayoutControls: false, maxColumns: 12,
                autoColumnOrder: (_count, node) => {
                    const max = choiceFor(node.props).columns;
                    if (choiceFor(node.props).id === 'metrics') return metricColumnOrder(_count, node);
                    return choiceFor(node.props).id.startsWith('ascending-') ? ascendingColumnOrder(_count,node) : collectionColumnOrder(_count, max);
                } },
            resolveLayoutContract(props) { return ['stat', 'image-text', 'icon-text'].includes(choiceFor(props).type) ? cards.layoutContract : definitionFor(props).layoutContract; },
            resolveItemCollection(props) {
                const choice = choiceFor(props);
                if (directionalProcessHeader(props) && props.orientation === 'vertical')
                    return { ...cards.itemCollection, maxColumns: 1, showLayoutControls: false, toolbarLabel: choice.label };
                return { ...cards.itemCollection, maxColumns: choice.columns, fixedLayout: choice.type === 'shape-contents' || (choice.id === 'alternating' || choice.id.startsWith('timeline-')),
                    showLayoutControls: choice.columns > 1, preferenceProp: 'columnPreference', toolbarLabel: choice.label };
            },
            validate(props, warnings) {
                const choice = choiceFor(props), content = (0, __doeScope.extract)({ id: 'contents', type: __doeScope.CONTENTS_TYPE, props });
                if (!choice || !content || !(0, __doeScope.eligible)(content, choice))
                    warnings.push('Contents 内容与展示条件不匹配。');
            },
            render(node, helpers) {
                return this.renderPresentation(node, helpers);
            },
            renderPresentation(node, helpers) {
                if (!choiceFor(node.props))
                    throw new Error('未知 Contents 样式。');
                if (!isSimple(node.props)) {
                    const root = definitionFor(node.props).render(projected(node), helpers);
                    clean(root, node.props);
                    return root;
                }
                const root = cards.render({ ...node, props: { ...node.props, variant: 'filled-icon' } }, helpers);
                const choice = choiceFor(node.props);
                if (['image-text', 'icon-text', 'question-card', 'quote'].includes(choice.type)) {
                    root.querySelectorAll('.item-cards__surface').forEach((surface, index) => {
                        const value = node.props.items[index];
                        const props = choice.type === 'image-text' ? { ...imageCardProps(node.props), surface: 'none', src: value.src, alt: value.alt || '', title: value.title || '', text: value.text || '' } : choice.type === 'icon-text' ? { title: value.title || '', text: value.text || '', icon: value.icon || '' }
                            : choice.type === 'quote' ? { text: value.text, source: value.source } : { title: value.title, text: value.text, index: value.label, icon: value.icon };
                        const content = definitionFor(node.props).render({ props }, { ...helpers, autoIndex: index + 1 });
                        if (choice.type === 'icon-text') {
                            if (value.icon === undefined) content.querySelector('.base-media__icon')?.remove();
                            for (const field of ['title', 'text'])
                                if (!props[field].trim()) content.querySelector(`.base-media__${field}`)?.remove();
                        }
                        if (choice.type === 'image-text') {
                            surface.dataset.imageSurface = node.props.surface || 'none';
                            content.querySelector('.base-media__image').dataset.contentsImageIndex = String(index);
                        }
                        surface.replaceChildren(content);
                    });
                }
                clean(root, node.props);
                return root;
            },
            adapt(root, node, context) {
                const choice = choiceFor(node.props);
                if (!isSimple(node.props))
                    definitionFor(node.props).adapt?.(root, projected(node), context);
                else {
                    cards.adapt(root, node, context);
                    const requested = choice.columns === 1 ? 1 : Number(context.autoItemColumns ?? node.props.itemColumns) || choice.columns;
                    const columns = context.flowLayout ? Math.max(1, Math.min(choice.columns, requested, node.props.items.length)) : collectionColumns(context.width, Math.min(choice.columns, requested), node.props.items.length, context.gap || 24);
                    if (Number(root.dataset.columns) !== columns) {
                        root.dataset.columns = String(columns);
                        const grid = root.querySelector('.item-cards__grid');
                        const items = (root).__items;
                        grid.replaceChildren();
                        for (let i = 0; i < items.length; i += columns) {
                            const row = root.ownerDocument.createElement('div');
                            row.className = 'item-cards__row';
                            const cells = items.slice(i, i + columns);
                            row.style.setProperty('--item-row-columns', String(cells.length));
                            row.append(...cells);
                            grid.append(row);
                        }
                    }
                }
                if (choice.type === 'image-text') {
                    root.querySelectorAll('.base-media[data-kind="image"]').forEach((entry, index) => definitionFor(node.props).adapt(entry, { props: { ...imageCardProps(node.props), ...node.props.items[index] } }, { ...context, width: imageCardContentWidth(entry.parentElement, entry.parentElement.clientWidth) }));
                }
                clean(root, node.props);
            },
            textFields(root, node) {
                const choice = choiceFor(node.props);
                if (choice.id === 'metrics') {
                    return [...root.querySelectorAll('.component-stat')].flatMap((entry, index) =>
                        runtime.DOETextFields.fields(entry, { type: 'stat', props: metricProps(node.props.items[index]) }).map(field => ({
                            ...field, path: ['items', index, { value: 'title', label: 'label', description: 'text' }[field.path[0]]],
                        })));
                }
                if (isList(node.props)) {
                    return runtime.DOETextFields.fields(root, projected(node)).map(field => ({
                        ...field, path: field.path[0] === 'items' ? [...field.path, 'text'] : field.path,
                    }));
                }
                if (['image-text', 'icon-text', 'question-card', 'quote'].includes(choice.type)) {
                    return [...root.querySelectorAll('.item-cards__surface')].flatMap((entry, index) => {
                        const value = node.props.items[index];
                        return runtime.DOETextFields.fields(entry, { type: choice.type, props: { ...value, index: value.label } }).map((field) => ({ ...field, path: ['items', index, field.path[0] === 'index' ? 'label' : field.path[0]] }));
                    });
                }
                const target = projected(node);
                if (choice.type === 'columns')
                    target.type = 'item-cards';
                const fields = runtime.DOETextFields.fields(root, target).map((field) => ({ ...field, path: field.path[0] === 'content' ? field.path.slice(1) : field.path }));
                return fields;
            },
            iconFields(root, node) {
                const choice = choiceFor(node.props);
                if (!choice.icons)
                    return [];
                const markers = itemIconFields(root);
                if (markers.length) return markers;
                if (choice.type === 'question-card')
                    return [...root.querySelectorAll('.item-cards__surface')].flatMap((entry, index) => runtime.DOEIconFields.fields(entry, { type: 'question-card', props: node.props.items[index] }).map(field => ({ ...field, path: ['items', index, ...field.path] })));
                if (choice.type === 'icon-text')
                    return [...root.querySelectorAll('.item-cards__surface')].flatMap((entry, index) => runtime.DOEIconFields.fields(entry, { type: 'icon-text', props: node.props.items[index] }).map(field => ({ ...field, path: ['items', index, ...field.path] })));
                const target = projected(node);
                return runtime.DOEIconFields.fields(root, target).map((field) => ({ ...field, path: field.path[0] === 'content' ? field.path.slice(1) : field.path }));
            },
        });
    }
