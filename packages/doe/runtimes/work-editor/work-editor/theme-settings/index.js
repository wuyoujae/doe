import { scope } from '../../../../integrations/work/editor/runtime/context/index.js';
import { releaseActiveResult } from '../release-active-result/index.js';
import { renderDeck } from '../render-deck/index.js';
import { currentDeck } from '../current-deck/index.js';
import { post } from '../post/index.js';
import { flushSlideEditors, hasIndependentCanvases } from '../continuous-view/index.js';
let changingTheme = false;

function createThemeCard(doc, theme, select) {
  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'work-editor__theme-card';
  button.dataset.themeOption = theme.id;
  button.setAttribute('aria-label', theme.label);
  button.innerHTML = `<span class="work-editor__theme-preview" aria-hidden="true">
    <span class="work-editor__theme-page">
      <span class="work-editor__theme-title"></span>
      <span class="work-editor__theme-body"><span></span> <span class="work-editor__theme-link"></span></span>
      <span class="work-editor__theme-palette"><i></i><i></i><i></i><i></i></span>
    </span>
  </span><span class="work-editor__theme-caption"><span class="work-editor__theme-name"></span><span class="work-editor__theme-check" aria-hidden="true">✓</span></span>`;
  const preview = button.querySelector('.work-editor__theme-preview');
  scope.global.PPTTheme.installVariables(preview, theme);
  // i18n-ignore: Fixed typography specimens show each theme's Latin font roles.
  button.querySelector('.work-editor__theme-title').textContent = 'Yrkie';
  // i18n-ignore: Fixed typography specimens, not interface instructions.
  button.querySelector('.work-editor__theme-body > span').textContent = 'Made for';
  // i18n-ignore: Fixed typography specimen demonstrating the theme's accent color.
  button.querySelector('.work-editor__theme-link').textContent = 'ideas';
  button.querySelector('.work-editor__theme-name').textContent = theme.label;
  button.addEventListener('click', () => {
    if (button.disabled) return;
    select.value = theme.id;
    select.dispatchEvent(new scope.global.Event('change', { bubbles: true }));
  });
  return button;
}

export function syncThemeSettings() {
  const doc = scope.elements?.settings?.ownerDocument || scope.global.document;
  let select = doc.getElementById('deck-theme');
  if (!select) {
    const container = doc.getElementById('settings-theme-options') || doc.querySelector('.work-editor__settings-accordion');
    if (!container) return;
    const field = doc.createElement('div');
    field.id = 'deck-theme-settings';
    const work = scope.runtimeSurface === 'work';
    field.className = work ? 'work-editor__theme-settings' : 'work-editor__settings-field';
    select = doc.createElement('select'); select.id = 'deck-theme';
    for (const theme of Object.values(scope.global.PPTTheme.themes)) {
      select.add(new scope.global.Option(theme.label, theme.id));
    }
    if (work) {
      select.hidden = true;
      select.tabIndex = -1;
      select.setAttribute('aria-hidden', 'true');
      const grid = doc.createElement('div');
      grid.className = 'work-editor__theme-grid';
      for (const theme of Object.values(scope.global.PPTTheme.themes)) grid.append(createThemeCard(doc, theme, select));
      field.append(select, grid);
    } else {
      const label = doc.createElement('label');
      label.htmlFor = 'deck-theme'; label.textContent = 'Theme';
      select.className = 'work-editor__custom-select-trigger';
      field.append(label, select);
    }
    container.prepend(field);
    select.addEventListener('change', async () => {
      if ((scope.state.generation || scope.state.hostReadOnly) || select.disabled) return;
      const nextTheme = scope.global.PPTTheme.normalizeThemeId(select.value);
      const previous = scope.state.theme;
      const slides = scope.state.slides;
      if (nextTheme === previous) return;
      changingTheme = true;
      syncThemeSettings();
      try {
        await flushSlideEditors();
        if (slides !== scope.state.slides || (scope.state.generation || scope.state.hostReadOnly)) return;
        scope.state.theme = nextTheme;
        if (!hasIndependentCanvases()) releaseActiveResult();
        if (await renderDeck({ replaceDeck: true, discardPrevious: true }) === false) {
          throw new Error('幻灯片渲染失败');
        }
        scope.state.dirty = true;
        post('deck-change', { dirty: true, action: '切换主题', index: scope.state.activeIndex, total: scope.state.slides.length, deck: currentDeck() });
      } catch (error) {
        if (slides !== scope.state.slides) return;
        scope.state.theme = previous;
        if (!hasIndependentCanvases()) releaseActiveResult();
        await renderDeck({ replaceDeck: true, discardPrevious: true });
        post('error', { message: `主题切换失败：${error.message}` });
      } finally { changingTheme = false; syncThemeSettings(); }
    });
  }
  select.value = scope.state.theme;
  select.disabled = changingTheme || Boolean((scope.state.generation || scope.state.hostReadOnly));
  const grid = select.parentElement.querySelector('.work-editor__theme-grid');
  if (!grid) return;
  grid.setAttribute('aria-busy', String(changingTheme));
  for (const button of grid.querySelectorAll('[data-theme-option]')) {
    button.disabled = select.disabled;
    button.setAttribute('aria-pressed', String(button.dataset.themeOption === scope.state.theme));
  }
}
