import defaultTheme from '../../../../doe-theme/src/theme/yrkie-theme/index.json' with { type: 'json' };
import { parseTerms } from '../parse-terms/index.js';
import { validTextColor, textColorCSS } from './color.js';
import { wrapContactTokens } from '../wrap-contact-tokens/index.js';
export const FORMAT_KEYS = ['size', 'bold', 'italic', 'underline', 'strike', 'mark', 'color'];
export const typographyStyles = (view = globalThis) => view.PPTTheme?.theme?.typography?.styles || defaultTheme.typography.styles;
const own = (value, key) => value != null && Object.hasOwn(value, key);
export function fieldValue(props, path) {
    let value = props;
    for (const key of path) {
        if (['__proto__', 'prototype', 'constructor'].includes(key) || !own(value, key))
            return undefined;
        value = value[key];
    }
    return Array.isArray(value) ? value.join('\n') : typeof value === 'string' ? value : undefined;
}
export function normalizeRuns(runs, length) {
    if (!Array.isArray(runs))
        return [];
    const result = [];
    for (const run of runs.slice(0, 2048)) {
        if (!run || !Number.isInteger(run.start) || !Number.isInteger(run.end) || run.start < 0 || run.end > length || run.end <= run.start || run.start < (result.at(-1)?.end || 0))
            continue;
        const next = { start: run.start, end: run.end };
        for (const key of FORMAT_KEYS) {
            if (key === 'size' ? typeof run[key] === 'string' && Object.hasOwn(typographyStyles(), run[key]) : key === 'color' ? validTextColor(run[key]) : typeof run[key] === 'boolean')
                next[key] = run[key];
        }
        if (Object.keys(next).length > 2)
            result.push(next);
    }
    return result;
}
export function normalizeOverrides(entries, props) {
    if (!Array.isArray(entries))
        return [];
    const seen = new Set();
    return entries.slice(0, 512).flatMap(entry => {
        if (!entry || !Array.isArray(entry.path) || !entry.path.length || entry.path.length > 12 || entry.path.some(x => typeof x !== 'string' && !Number.isInteger(x)) || typeof entry.text !== 'string' || fieldValue(props, entry.path) !== entry.text)
            return [];
        const key = JSON.stringify(entry.path), runs = normalizeRuns(entry.runs, entry.text.length);
        if (seen.has(key) || !runs.length)
            return [];
        seen.add(key);
        return [{ path: [...entry.path], text: entry.text, runs }];
    });
}
export function fieldFormat(node, path) {
    return normalizeOverrides(node.textOverrides, node.props).find(entry => JSON.stringify(entry.path) === JSON.stringify(path));
}
export function saveFieldFormat(node, path, text, runs) {
    const entries = (node.textOverrides || []).filter(entry => JSON.stringify(entry.path) !== JSON.stringify(path));
    if (runs.length)
        entries.push({ path: [...path], text, runs });
    const normalized = normalizeOverrides(entries, node.props);
    if (normalized.length)
        node.textOverrides = normalized;
    else
        delete node.textOverrides;
}
const marks = run => Object.fromEntries(FORMAT_KEYS.filter(key => own(run, key)).map(key => [key, run[key]]));
export function formatRange(runs, start, end, patch) {
    if (end <= start)
        return runs;
    const points = [...new Set([start, end, ...runs.flatMap(run => [run.start, run.end])])].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        let style = marks(runs.find(run => run.start <= a && run.end >= b) || {});
        if (a >= start && b <= end)
            style = patch === null ? {} : { ...style, ...patch };
        for (const key of FORMAT_KEYS)
            if (style[key] === undefined)
                delete style[key];
        style = marks(style);
        if (!Object.keys(style).length)
            continue;
        const last = result.at(-1);
        if (last?.end === a && JSON.stringify(marks(last)) === JSON.stringify(style))
            last.end = b;
        else
            result.push({ start: a, end: b, ...style });
    }
    return result;
}
export function rebaseRuns(runs, previous, next) {
    if (previous === next)
        return runs;
    let start = 0, oldEnd = previous.length, newEnd = next.length;
    while (start < oldEnd && start < newEnd && previous[start] === next[start])
        start++;
    while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) {
        oldEnd--;
        newEnd--;
    }
    const delta = newEnd - oldEnd, result = [];
    for (const run of runs) {
        if (run.start < start)
            result.push({ ...run, end: Math.min(run.end, start) });
        if (run.end > oldEnd)
            result.push({ ...run, start: Math.max(run.start, oldEnd) + delta, end: run.end + delta });
    }
    result.sort((a, b) => a.start - b.start);
    const inherited = runs.find(run => run.start <= start && run.end > start) || runs.find(run => run.end === start);
    return inherited && newEnd > start ? formatRange(result, start, newEnd, marks(inherited)) : result;
}
export function renderInlineFormat(element, text, runs) {
    const document = element.ownerDocument, fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const run of runs) {
        if (run.start > cursor)
            fragment.append(document.createTextNode(text.slice(cursor, run.start)));
        const span = document.createElement('span');
        span.dataset.doeTextRun = 'true';
        span.textContent = text.slice(run.start, run.end);
        if (run.size && Object.hasOwn(typographyStyles(document.defaultView), run.size))
            span.style.fontSize = `var(--typography-${run.size}-size)`;
        if (own(run, 'bold'))
            span.style.fontWeight = `var(--yrkie-font-weight-${run.bold ? 'bold' : 'regular'})`;
        if (own(run, 'italic')) {
            span.style.fontStyle = run.italic ? 'italic' : 'normal';
            // Bundled upright faces need style synthesis for an authored italic mark.
            if (run.italic)
                span.style.fontSynthesis = 'style';
        }
        if (own(run, 'underline') || own(run, 'strike'))
            span.style.textDecorationLine = [run.underline ? 'underline' : '', run.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none';
        if (own(run, 'mark')) {
            span.style.backgroundColor = run.mark ? 'var(--yrkie-color-mark)' : 'transparent';
            if (run.mark) span.style.color = 'var(--yrkie-color-on-mark)';
        }
        if (validTextColor(run.color)) span.style.color = textColorCSS(run.color);
        fragment.append(span);
        cursor = run.end;
    }
    fragment.append(document.createTextNode(text.slice(cursor)));
    element.replaceChildren(fragment);
    if (element.dataset.semanticWrap && runs.length) protectSemanticRuns(element, text);
    element.__semanticProjection = { text, breaks: [] };
    element.dataset.semanticSource = text;
    element.classList.toggle('doe-formatted-text', runs.length > 0);
}

// Keep the browser's mixed-font shaping, but restrict soft breaks to the same
// semantic tokens as plain text. Ranges clone styles without changing offsets.
function protectSemanticRuns(element, text) {
    const service = element.ownerDocument.defaultView.SemanticTextLayout;
    if (!service?.tokenize) return;
    const document = element.ownerDocument, nodes = [], walker = document.createTreeWalker(element, 4);
    let node, offset = 0;
    while ((node = walker.nextNode())) {
        nodes.push({ node, start: offset, end: offset + node.length });
        offset += node.length;
    }
    if (!nodes.length) return;
    const fragment = document.createDocumentFragment();
    const append = (start, end, token) => {
        if (start === end) return;
        const first = nodes.find(entry => entry.end > start), last = nodes.find(entry => entry.end >= end);
        const range = document.createRange();
        range.setStart(first.node, start - first.start); range.setEnd(last.node, end - last.start);
        let copy = range.cloneContents();
        // cloneContents omits a style ancestor if both ends are in its text node.
        if (first.node === last.node && first.node.parentElement !== element) {
            const styled = first.node.parentElement.cloneNode(false); styled.append(copy); copy = styled;
        }
        if (!token) { fragment.append(copy); return; }
        const span = document.createElement('span');
        span.className = 'semantic-text-token'; span.style.whiteSpace = 'nowrap'; span.append(copy);
        fragment.append(span);
    };
    const protectedTerms = parseTerms(element.dataset.semanticTerms);
    let segmentation = service.tokenize(text, { locale: element.dataset.semanticLocale || 'auto', protectedTerms });
    // Token offsets are paragraph-relative; format runs still use the original
    // UTF-16 source, whose CRLF/CR separators may differ from tokenize's LF.
    const bases = [0, ...Array.from(text.matchAll(/\r\n?|\n/gu), match => match.index + match[0].length)];
    const view = document.defaultView, style = view.getComputedStyle(element);
    const width = Math.max(0, element.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0))
        * Math.max(.72, Math.min(1, Number(element.dataset.semanticWidthSafety) || 1));
    if (width > 0 && service.createMeasure) {
        const metrics = new Map();
        // Shape each authored font run at its actual size. The field's base
        // font cannot predict the width of a contact containing larger/bold runs.
        const measureToken = (_text, token, paragraphIndex) => {
            const start = bases[paragraphIndex] + token.start, end = bases[paragraphIndex] + token.end;
            const chunks = [];
            for (const entry of nodes) {
                if (entry.start >= end || entry.end <= start) continue;
                const parent = entry.node.parentElement;
                let metric = metrics.get(parent);
                if (!metric) {
                    const css = view.getComputedStyle(parent);
                    const options = { fontFamily: css.fontFamily, fontWeight: css.fontWeight,
                        fontStyle: css.fontStyle, letterSpacingPx: parseFloat(css.letterSpacing) || 0 };
                    const fontPx = parseFloat(css.fontSize) || parseFloat(style.fontSize) || 16;
                    metric = { fontPx, key: JSON.stringify([options, fontPx]), measure: service.createMeasure(options) };
                    metrics.set(parent, metric);
                }
                const value = text.slice(Math.max(start, entry.start), Math.min(end, entry.end));
                const last = chunks.at(-1);
                if (last?.metric.key === metric.key) last.text += value;
                else chunks.push({ text: value, metric });
            }
            return chunks.reduce((sum, chunk) => sum + chunk.metric.measure(chunk.text, chunk.metric.fontPx), 0);
        };
        segmentation = wrapContactTokens(segmentation, width, measureToken, protectedTerms);
    }
    let cursor = 0;
    segmentation.paragraphs.forEach((tokens, index) => {
        const base = bases[index];
        for (const token of tokens) {
            const start = base + token.start, end = base + token.end;
            append(cursor, start, false);
            if (cursor > base) fragment.append(document.createElement('wbr'));
            append(start, end, true); cursor = end;
        }
    });
    append(cursor, text.length, false);
    element.replaceChildren(fragment);
}
