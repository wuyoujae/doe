import { item as __doeFn_item } from '../item/index.js';
import { IMAGE_CARD_FIELDS, IMAGE_CARD_DEFAULTS, imageCardProps, validateImageCardProps } from '../../../media-text/image-options.js';
// Origin: public/yrkie-doe/core/contents-model.js:62
import { scope as __doeScope } from "../runtime/context/index.js";

export function extract(node) {
        if (node.layout?.lock)
            return null;
        const props = node.props || {};
        const imageProps = imageCardProps(props), imageWarnings = [];
        validateImageCardProps(imageProps, imageWarnings);
        if (imageWarnings.length || (Object.keys(imageProps).length && node.type !== 'image-text' && !(node.type === __doeScope.CONTENTS_TYPE && props.presentation === 'image-text'))) return null;
        let values;
        let title, subtitle;
        if (node.type === __doeScope.CONTENTS_TYPE) {
            if (!(0, __doeScope.keysAllowed)(props, ['items', 'title', 'subtitle', 'itemColumns', 'itemLayout', 'columnPreference', 'presentation', 'orientation', 'staggered', 'connectors', ...IMAGE_CARD_FIELDS]))
                return null;
            values = props.items;
            // Stored group titles are accepted for compatibility, not presented or edited.
            subtitle = props.subtitle;
        }
        else if (['list', 'ordered-list'].includes(node.type)) {
            if (!(0, __doeScope.keysAllowed)(props, ['items', 'title', 'itemColumns', 'itemLayout']) || !Array.isArray(props.items) || props.items.some(value => typeof value !== 'string'))
                return null;
            values = props.items.map(text => ({ text }));
            // Converting a native list to Contents also retires its group heading.
        }
        else if (['item-cards', 'shape-contents'].includes(node.type)) {
            if (!(0, __doeScope.keysAllowed)(props, ['items', 'variant', 'itemColumns', 'itemLayout']))
                return null;
            values = props.items;
        }
        else if (['capability-cards', 'numbered-icon-cards'].includes(node.type)) {
            if (!(0, __doeScope.keysAllowed)(props, ['content', 'title', 'subtitle', 'itemColumns', 'itemLayout']) || !(0, __doeScope.keysAllowed)(props.content || {}, ['items']))
                return null;
            values = props.content?.items;
            // Legacy group titles remain readable in stored schema, but are
            // not part of these card families' editable/rendered content.
            subtitle = props.subtitle;
        }
        else if (node.type === 'stat') {
            if (!(0, __doeScope.keysAllowed)(props, ['value', 'label', 'description'])) return null;
            values = [{ title: String(props.value ?? ''), label: props.label, text: props.description }];
        }
        else if (node.type === 'image-text') {
            if (!(0, __doeScope.keysAllowed)(props, [...__doeScope.common, 'src', 'alt', ...IMAGE_CARD_FIELDS])) return null;
            values = [{ title: props.title, text: props.text, src: props.src, alt: props.alt }];
        }
        else if (node.type === 'icon-text') {
            if (!(0, __doeScope.keysAllowed)(props, __doeScope.common))
                return null;
            values = [{ title: props.title, text: props.text, icon: props.icon }];
        }
        else if (node.type === 'question-card') {
            if (!(0, __doeScope.keysAllowed)(props, ['title', 'text', 'index', 'icon']))
                return null;
            values = [{ title: props.title, text: props.text, label: props.index, icon: props.icon }];
        }
        else if (node.type === 'quote') {
            if (!(0, __doeScope.keysAllowed)(props, ['text', 'source']))
                return null;
            values = [{ text: props.text, source: props.source }];
        }
        else if (node.type === 'layout-group') {
            if (!node.children?.length || Object.keys(props).length || node.layout?.variant === 'edge-media')
                return null;
            if (!['columns', 'collection'].includes(node.layout?.variant) && !node.layout?.collectionKey)
                return null;
            const items = [];
            const imageStyles = [];
            for (const child of node.children) {
                if (child.layout?.lock)
                    return null;
                const direct = (0, extract)(child);
                if (direct && direct.items.length === 1 && !direct.title && !direct.subtitle) {
                    items.push({ ...direct.items[0], id: child.id });
                    imageStyles.push(imageCardProps(direct));
                    continue;
                }
                if (child.type !== 'layout-group' || Object.keys(child.props || {}).length || !['stack', undefined].includes(child.layout?.variant) || child.children?.length > 2)
                    return null;
                const entry = { id: child.id };
                for (const part of child.children || []) {
                    if (part.layout?.lock)
                        return null;
                    if (part.type === 'heading' && (0, __doeScope.keysAllowed)(part.props || {}, ['text', 'level']) && !entry.title)
                        entry.title = part.props.text;
                    else if (part.type === 'text' && (0, __doeScope.keysAllowed)(part.props || {}, ['title', 'text']) && !entry.text && !entry.title) {
                        entry.title = part.props.title;
                        entry.text = part.props.text;
                    }
                    else if (part.type === 'text' && (0, __doeScope.keysAllowed)(part.props || {}, ['text']) && !entry.text)
                        entry.text = part.props.text;
                    else
                        return null;
                }
                items.push(entry);
                imageStyles.push({});
            }
            const sharedImageProps = Object.assign({}, ...imageStyles);
            if (IMAGE_CARD_FIELDS.some(key => imageStyles.some(value => (value[key] ?? IMAGE_CARD_DEFAULTS[key]) !== (sharedImageProps[key] ?? IMAGE_CARD_DEFAULTS[key])))) return null;
            return { items, ...sharedImageProps, itemColumns: node.layout?.columns || 'auto', columnPreference: node.layout?.columns || 'auto' };
        }
        else
            return null;
        if (!Array.isArray(values) || !values.length || values.length > 12 || [title, subtitle].some(v => v !== undefined && typeof v !== 'string'))
            return null;
        const items = values.map((value, index) => (0, __doeFn_item)(value, `${node.id}-item-${index + 1}`));
        if (items.some(value => !value) || new Set(items.map(value => value?.id)).size !== items.length)
            return null;
        return (0, __doeScope.clone)({ items: items, ...imageProps, title, subtitle, itemColumns: props.itemColumns, itemLayout: props.itemLayout, columnPreference: props.columnPreference, orientation: props.orientation, staggered: props.staggered, connectors: props.connectors });
    }
