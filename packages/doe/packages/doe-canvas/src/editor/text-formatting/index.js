import { createTextColorPicker } from './color-picker.js';
import { typographyStyles, fieldFormat, formatRange, rebaseRuns, renderInlineFormat, saveFieldFormat } from '../../../../doe-core/src/text/inline-format/index.js';
export function createTextFormatting({ target, node, path, model, signal, plain, finish }) {
    if (target.namespaceURI !== 'http://www.w3.org/1999/xhtml')
        return null;
    const document = target.ownerDocument, view = document.defaultView, defaults = view.getComputedStyle(target);
    let text = model?.source() ?? plain(target), runs = fieldFormat(node, path)?.runs || [], active = runs.length > 0, composing = false, replaying = false, savedRange = null;
    const initialRuns = JSON.stringify(runs), originalFormat = target.__doeInlineFormat, undo = [], redo = [];
    const toolbar = document.createElement('div');
    toolbar.className = 'block-toolbar text-edit-toolbar doe-toolbar-preview doe-text-selection-toolbar';
    toolbar.dataset.doeToolbarPreviewFamily = 'text';
    toolbar.hidden = true;
    toolbar.dataset.slideExportIgnore = 'true';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', '选中文字格式');
    const size = document.createElement('select');
    size.className = 'text-edit-toolbar__button';
    size.setAttribute('aria-label', '字号');
    for (const [value, label] of [['default', '组件默认'], ['mixed', '混合字号'], ...Object.keys(typographyStyles(view)).map(id => [id, id])]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        option.disabled = value === 'mixed';
        size.append(option);
    }
    toolbar.append(size);
    const colorPicker = createTextColorPicker({ target, toolbar, signal, apply });
    toolbar.append(colorPicker.element);
    const formatGroup = document.createElement('div');
    formatGroup.className = 'text-edit-toolbar__format-group';
    toolbar.append(formatGroup);
    const buttons = {};
    for (const [key, label, iconName] of [['bold', '加粗', 'Bold'], ['italic', '斜体', 'Italic'], ['underline', '下划线', 'Underline'], ['strike', '中划线', 'Strikethrough'], ['mark', '标记', 'Highlighter'], ['clear', '恢复默认样式', 'RemoveFormatting']]) {
        const button = document.createElement('button');
        button.className = 'text-edit-toolbar__button text-edit-toolbar__format-button';
        button.type = 'button';
        button.dataset.format = key;
        button.setAttribute('aria-label', label);
        button.title = label;
        const iconData = view.lucide?.icons?.[iconName] || view.lucide?.[iconName];
        if (iconData)
            button.append(view.lucide.createElement(iconData, { class: 'text-edit-toolbar__icon', 'aria-hidden': 'true', 'stroke-width': 2 }));
        else
            button.textContent = label;
        formatGroup.append(button);
        buttons[key] = button;
        button.addEventListener('pointerdown', event => event.preventDefault(), { signal });
        button.addEventListener('click', () => apply(key === 'clear' ? null : { [key]: button.getAttribute('aria-pressed') !== 'true' }), { signal });
    }
    let layer = document.querySelector('.doe-toolbar-preview-layer');
    const ownsLayer = !layer;
    if (!layer) {
        layer = document.createElement('div');
        layer.className = 'doe-toolbar-preview-layer';
        document.body.append(layer);
    }
    layer.append(toolbar);
    const options = { signal };
    function selection() {
        const selected = view.getSelection();
        if (!selected?.rangeCount || !target.contains(selected.anchorNode) || !target.contains(selected.focusNode))
            return null;
        const offset = (node, index) => { const range = document.createRange(); range.selectNodeContents(target); range.setEnd(node, index); const n = plain(range.cloneContents()).length; return model?.sourceOffset(n) ?? n; };
        return { anchor: offset(selected.anchorNode, selected.anchorOffset), focus: offset(selected.focusNode, selected.focusOffset) };
    }
    function restore(range) {
        if (!range)
            return;
        const at = offset => { const walker = document.createTreeWalker(target, view.NodeFilter.SHOW_TEXT); let node, last = null, n = Math.max(0, offset); while (node = walker.nextNode()) {
            last = node;
            if (n <= node.length)
                return [node, n];
            n -= node.length;
        } return last ? [last, last.length] : [target, 0]; };
        const anchor = at(model?.displayOffset(range.anchor) ?? range.anchor), focus = at(model?.displayOffset(range.focus) ?? range.focus);
        view.getSelection()?.setBaseAndExtent(...anchor, ...focus);
    }
    function snapshot() { return { text, runs: structuredClone(runs), range: selection() || savedRange }; }
    let previous = snapshot();
    function paint(range) {
        renderInlineFormat(target, text, runs);
        target.__doeInlineFormat = { text, runs };
        model?.reset({ text, breaks: [] });
        restore(range);
        previous = snapshot();
        updateToolbar();
    }
    function remember() { undo.push(previous); if (undo.length > 100)
        undo.shift(); redo.length = 0; }
    function updateToolbar() {
        if (composing)
            return;
        const range = selection();
        if (range && range.anchor !== range.focus)
            savedRange = range;
        else if (!toolbar.contains(document.activeElement)) {
            toolbar.hidden = true;
            colorPicker.close();
            return;
        }
        if (!savedRange)
            return;
        const start = Math.min(savedRange.anchor, savedRange.focus), end = Math.max(savedRange.anchor, savedRange.focus);
        const points = [start, ...runs.flatMap(run => [run.start, run.end]).filter(n => n > start && n < end)];
        const styles = points.map(n => runs.find(run => run.start <= n && run.end > n) || {});
        colorPicker.update(styles.map(style => style.color));
        const sizes = styles.map(style => style.size || 'default');
        size.value = sizes.every(value => value === sizes[0]) ? sizes[0] : 'mixed';
        for (const key of ['bold', 'italic', 'underline', 'strike', 'mark']) {
            const fallback = key === 'mark' ? false : key === 'bold' ? Number(defaults.fontWeight) >= Number(defaults.getPropertyValue('--yrkie-font-weight-bold')) : key === 'italic' ? defaults.fontStyle === 'italic' : defaults.textDecorationLine.includes(key === 'underline' ? 'underline' : 'line-through');
            const values = styles.map(style => style[key] ?? fallback);
            buttons[key].setAttribute('aria-pressed', values.every(value => value) ? 'true' : values.some(value => value) ? 'mixed' : 'false');
        }
        toolbar.hidden = false;
        const selected = view.getSelection(), rect = selected?.rangeCount && target.contains(selected.anchorNode) ? selected.getRangeAt(0).getBoundingClientRect() : target.getBoundingClientRect();
        const bounds = toolbar.getBoundingClientRect();
        toolbar.style.left = `${Math.max(8, Math.min(rect.left + (rect.width - bounds.width) / 2, view.innerWidth - bounds.width - 8))}px`;
        toolbar.style.top = `${Math.max(8, rect.top - bounds.height - 8 < 8 ? Math.min(rect.bottom + 8, view.innerHeight - bounds.height - 8) : rect.top - bounds.height - 8)}px`;
    }
    function apply(patch) {
        if (!savedRange)
            return;
        previous = snapshot();
        remember();
        const range = savedRange, start = Math.min(range.anchor, range.focus), end = Math.max(range.anchor, range.focus);
        runs = formatRange(runs, start, end, patch);
        active = true;
        target.focus({ preventScroll: true });
        paint(range);
    }
    function input() {
        if (composing)
            return;
        const range = selection();
        model?.update(plain(target));
        const next = model?.source() ?? plain(target);
        // Convert selection offsets after updating the semantic line projection.
        const nextRange = selection() || range;
        if (next !== text) {
            if (!replaying)
                remember();
            runs = rebaseRuns(runs, text, next);
            text = next;
        }
        if (active)
            paint(nextRange);
        else {
            view.SemanticTextLayout?.refreshEditing(target, model);
            previous = snapshot();
            updateToolbar();
        }
    }
    function history(from, to) {
        if (!from.length)
            return;
        to.push(snapshot());
        const entry = from.pop();
        text = entry.text;
        runs = entry.runs;
        active = true;
        replaying = true;
        paint(entry.range);
        replaying = false;
    }
    size.addEventListener('change', () => { if (size.value === 'default' || Object.hasOwn(typographyStyles(view), size.value))
        apply({ size: size.value === 'default' ? undefined : size.value }); }, options);
    document.addEventListener('selectionchange', updateToolbar, options);
    view.addEventListener('resize', updateToolbar, options);
    view.addEventListener('scroll', updateToolbar, { ...options, capture: true });
    document.addEventListener('pointerdown', event => { if (!target.contains(event.target) && !toolbar.contains(event.target) && !event.target.closest('.block-handle'))
        finish(true); }, { ...options, capture: true });
    target.addEventListener('beforeinput', event => {
        previous = snapshot();
        if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') {
            event.preventDefault();
            history(event.inputType === 'historyUndo' ? undo : redo, event.inputType === 'historyUndo' ? redo : undo);
        }
        else if (!composing && (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak')) {
            event.preventDefault();
            view.SemanticTextLayout.insertEditingText(target, '\n');
        }
    }, options);
    target.addEventListener('keydown', event => {
        if (event.isComposing || composing || !(event.ctrlKey || event.metaKey) || event.altKey)
            return;
        const key = event.key.toLowerCase();
        if (['b', 'i', 'u'].includes(key) && selection()?.anchor !== selection()?.focus) {
            event.preventDefault();
            apply({ [{ b: 'bold', i: 'italic', u: 'underline' }[key]]: buttons[{ b: 'bold', i: 'italic', u: 'underline' }[key]].getAttribute('aria-pressed') !== 'true' });
        }
        if (key === 'z' || key === 'y') {
            event.preventDefault();
            event.stopPropagation();
            history(key === 'y' || event.shiftKey ? redo : undo, key === 'y' || event.shiftKey ? undo : redo);
        }
    }, options);
    target.addEventListener('compositionstart', () => { previous = snapshot(); composing = true; toolbar.hidden = true; }, options);
    target.addEventListener('compositionend', () => { composing = false; input(); }, options);
    signal.addEventListener('abort', () => { toolbar.remove(); if (ownsLayer && !layer.childElementCount)
        layer.remove(); if (originalFormat)
        target.__doeInlineFormat = originalFormat;
    else
        delete target.__doeInlineFormat; target.classList.toggle('doe-formatted-text', Boolean(originalFormat?.runs.length)); }, { once: true });
    return { input, owns: element => toolbar.contains(element), changed: () => JSON.stringify(runs) !== initialRuns,
        save: () => saveFieldFormat(node, path, text, runs), source: () => text };
}
