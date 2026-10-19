import { extract as __doeFn_extract } from '../extract/index.js';
import { eligible as __doeFn_eligible } from '../eligible/index.js';
import { currentChoice as __doeFn_currentChoice } from '../current-choice/index.js';
// Origin: public/yrkie-doe/core/contents-model.js:154
import { scope as __doeScope } from "../runtime/context/index.js";

export function replace(node, choiceId, resolvedColumns) {
        const content = (0, __doeFn_extract)(node), choice = __doeScope.CHOICES.find(entry => entry.id === choiceId);
        if (!content || !choice || !(0, __doeFn_eligible)(content, choice))
            throw new Error('当前内容不适用于这个样式，请重新选择。');
        const { children: _children, kind: _kind, props: _props, ...rest } = (0, __doeScope.clone)(node);
        const layout = { ...rest.layout };
        // Group-only layout hints must not survive onto a leaf. Preserve its parent slot.
        if (node.type === 'layout-group')
            for (const key of Object.keys(layout))
                if (!['span', 'priority', 'region', 'lock', 'textFit', 'slotSpace'].includes(key))
                    delete layout[key];
        let preference = content.columnPreference ?? (content.itemLayout === 'stack' ? 1 : content.itemLayout === 'auto' ? 'auto' : content.itemColumns ?? 'auto');
        const sourceList = (0, __doeFn_currentChoice)(node)?.startsWith('list:');
        if (sourceList || choice.id.startsWith('list:')) {
            // Freeze the visible list layout when crossing categories. A wider
            // Contents preference must never produce three-column base lists.
            const visible = Number(resolvedColumns) || (preference !== 'auto' ? Number(preference) : sourceList ? (content.items.length >= 6 ? 2 : 1) : 2);
            preference = Math.max(1, Math.min(2, visible));
        }
        return { ...rest, type: __doeScope.CONTENTS_TYPE, layout, props: { ...content, presentation: choice.id, columnPreference: preference,
                itemColumns: preference === 'auto' ? 'auto' : Math.min(choice.columns, Number(preference)), itemLayout: choice.columns === 1 || preference === 1 ? 'stack' : preference === 'auto' ? 'auto' : 'grid' } };
    }
