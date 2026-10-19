import { TEXT_THEME_COLORS, textColorCSS } from '../../../../doe-core/src/text/inline-format/color.js';

const systemColors = [
    '#000000', '#4B4B4B', '#808080', '#B3B3B3', '#D9D9D9', '#FFFFFF',
    '#FFF09B', '#FFD0A4', '#F6A3A8', '#D4ADF2', '#ACC9F2', '#AFE0C1',
    '#F8DC31', '#FF9D43', '#F5414C', '#AD55DC', '#578DEA', '#51BE7D',
    '#A68A00', '#995212', '#990C18', '#5D218D', '#194790', '#1C6B38',
];
const themeLabels = ['主题主色', '主题辅色', '正文色', '标题色', '浅色'];

export function createTextColorPicker({ target, toolbar, signal, apply }) {
    const document = target.ownerDocument, view = document.defaultView;
    const root = document.createElement('div'); root.className = 'doe-text-color';
    const trigger = document.createElement('button');
    trigger.type = 'button'; trigger.className = 'text-edit-toolbar__button doe-text-color__trigger';
    trigger.setAttribute('aria-label', '文字颜色'); trigger.title = '文字颜色';
    trigger.setAttribute('aria-haspopup', 'dialog'); trigger.setAttribute('aria-expanded', 'false');
    const letter = document.createElement('span'); letter.textContent = 'A';
    trigger.append(letter);
    const panel = document.createElement('div'); panel.className = 'doe-text-color__panel'; panel.hidden = true;
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '选择文字颜色');
    const swatches = [];
    for (const [label, colors] of [['主题颜色', TEXT_THEME_COLORS.map(key => `theme:${key}`)], ['系统颜色', systemColors]]) {
        const heading = document.createElement('div'); heading.className = 'doe-text-color__label'; heading.textContent = label;
        const grid = document.createElement('div'); grid.className = 'doe-text-color__grid';
        colors.forEach((color, index) => {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'doe-text-color__swatch';
            button.dataset.textColor = color;
            button.setAttribute('aria-label', color.startsWith('theme:') ? themeLabels[index] : color);
            button.title = button.getAttribute('aria-label'); button.setAttribute('aria-pressed', 'false');
            button.addEventListener('click', () => { close(); apply({ color }); }, { signal });
            grid.append(button); swatches.push(button);
        });
        panel.append(heading, grid);
    }
    const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'text-edit-toolbar__button doe-text-color__reset';
    reset.textContent = '恢复默认颜色';
    reset.addEventListener('click', () => { close(); apply({ color: undefined }); }, { signal });
    panel.append(reset); root.append(trigger, panel);
    root.addEventListener('pointerdown', event => event.preventDefault(), { signal });
    function close() { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
    trigger.addEventListener('click', () => {
        panel.hidden = !panel.hidden; trigger.setAttribute('aria-expanded', String(!panel.hidden));
        if (!panel.hidden) {
            panel.style.left = '0px';
            const box = panel.getBoundingClientRect();
            panel.style.left = `${Math.max(8 - box.left, Math.min(0, view.innerWidth - 8 - box.right))}px`;
            const height = panel.offsetHeight, toolbarBox = toolbar.getBoundingClientRect();
            panel.style.top = toolbarBox.bottom + height > view.innerHeight - 8 && toolbarBox.top > height + 8 ? `-${height + 8}px` : 'calc(100% + .5rem)';
        }
    }, { signal });
    toolbar.addEventListener('pointerdown', event => { if (!root.contains(event.target)) close(); }, { signal });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); event.stopPropagation(); close(); target.focus({ preventScroll: true }); }
    }, { signal, capture: true });
    return { element: root, close, update(colors) {
        const css = view.getComputedStyle(target);
        const resolve = color => color?.startsWith('theme:') ? css.getPropertyValue(`--yrkie-color-${color.slice(6)}`).trim() : textColorCSS(color);
        const uniform = colors.every(color => color === colors[0]);
        letter.style.borderBottomColor = uniform ? resolve(colors[0]) || css.color : css.color;
        trigger.dataset.mixed = String(!uniform);
        for (const button of swatches) {
            button.style.backgroundColor = resolve(button.dataset.textColor);
            button.setAttribute('aria-pressed', String(uniform && colors[0] === button.dataset.textColor));
        }
    } };
}
