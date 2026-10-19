import { scope } from '../../../../integrations/work/editor/runtime/context/index.js';
import { currentSlide } from '../current-slide/index.js';
import { currentDeck } from '../current-deck/index.js';
import { renderDeck } from '../render-deck/index.js';
import { releaseActiveResult } from '../release-active-result/index.js';
import { post } from '../post/index.js';
import { normalizeLogo, BRAND_LOGO_SRC } from '../../../../packages/doe-document/src/document/presentation/schema/logo/index.js';
import { openCustomSelect } from '../open-custom-select/index.js';
import { closeCustomSelect } from '../close-custom-select/index.js';
import { closeCustomSelects } from '../close-custom-selects/index.js';
import { setCustomSelectValue } from '../set-custom-select-value/index.js';
import { setSettingsOpen } from '../set-settings-open/index.js';
import { flushSlideEditors, hasIndependentCanvases, isCurrentSlideResult } from '../continuous-view/index.js';

let busy = false;
let previewVersion = 0;
const label = (key, fallback) => scope.state.settingsLabels?.[key] || fallback;

async function commitLogo(singlePage, logo, expectedResult = scope.state.activeResult) {
  const ownerSlides = scope.state.slides;
  const slideId = expectedResult?.slide?.id;
  const check = () => {
    if (busy || (scope.state.generation || scope.state.hostReadOnly) || ownerSlides !== scope.state.slides || !isCurrentSlideResult(expectedResult)) {
      throw new Error(label('logoChanged', '页面已变化，请重新打开 Logo 设置。'));
    }
  };
  check();
  await flushSlideEditors();
  check();
  const index = ownerSlides.findIndex(entry => entry.id === slideId);
  const slide = ownerSlides[index];
  const before = singlePage ? slide.logo : scope.state.logo;
  const hadOverride = Object.hasOwn(slide, 'logo');
  const previousDirty = scope.state.dirty;
  busy = true;
  try {
    if (singlePage) {
      const draft = { ...slide };
      if (logo === undefined) delete draft.logo;
      else draft.logo = normalizeLogo(logo);
      ownerSlides[index] = draft;
    } else scope.state.logo = normalizeLogo(logo);
    if (!hasIndependentCanvases()) releaseActiveResult();
    if (!await renderDeck({ discardPrevious: true })) throw new Error(label('logoUpdateFailed', 'Logo 更新失败，请重试。'));
    scope.state.dirty = true;
    post('deck-change', { dirty: true, action: '设置页面 Logo', index: scope.state.activeIndex, total: scope.state.slides.length, deck: currentDeck() });
  } catch (error) {
    if (scope.state.slides !== ownerSlides) throw error;
    if (singlePage) {
      const savedIndex = scope.state.slides.findIndex(entry => entry.id === slide.id);
      if (savedIndex >= 0) {
        const restored = { ...scope.state.slides[savedIndex] };
        if (hadOverride) restored.logo = before;
        else delete restored.logo;
        scope.state.slides[savedIndex] = restored;
      }
    } else scope.state.logo = before;
    scope.state.dirty = previousDirty;
    if (!hasIndependentCanvases()) releaseActiveResult();
    await renderDeck({ discardPrevious: true });
    throw error;
  } finally { busy = false; syncLogoSettings(); }
}

function openPicker(singlePage) {
  const bridge = scope.global.DOEContentEditor;
  const target = scope.state.activeResult;
  if (!target || busy || (scope.state.generation || scope.state.hostReadOnly) || !bridge?.openLogo) return;
  const logo = singlePage && Object.hasOwn(currentSlide(), 'logo') ? currentSlide().logo : scope.state.logo;
  if (scope.runtimeSurface !== 'work') setSettingsOpen(false);
  bridge.openLogo({
    element: scope.runtimeSurface === 'work' ? scope.elements.settings.querySelector(singlePage ? '#slide-logo-mode' : '[data-logo="replace"]') : scope.elements.settingsTrigger,
    props: { src: logo?.src || '', fit: 'contain', aspectRatio: '16:9' },
    async apply(props) {
      const value = normalizeLogo(props);
      if (!value) throw new Error(label('chooseLogo', '请选择 Logo 图片。'));
      await commitLogo(singlePage, value, target);
    },
  });
}

async function refreshLogoPreview(field) {
  const revision = ++previewVersion;
  const preview = field.querySelector('.work-editor__logo-preview');
  const result = scope.state.activeResult;
  preview.hidden = scope.runtimeSurface !== 'work' || !scope.state.settingsOpen || scope.state.settingsSection !== 'logo';
  if (preview.hidden || !result) return;
  const frame = preview.querySelector('doe-canvas');
  try {
    const snapshot = await result.captureStaticSnapshot();
    if (revision !== previewVersion || result !== scope.state.activeResult || !frame.isConnected) return;
    frame.dataset.canvasMode = 'static';
    frame.canvasElement.replaceChildren(snapshot.element);
    frame.resize();
    field.querySelector('[data-logo-preview-status]').textContent = '';
  } catch {
    if (revision === previewVersion && result === scope.state.activeResult) {
      field.querySelector('[data-logo-preview-status]').textContent = label('previewFailed', '预览暂不可用，请重新打开设置。');
    }
  }
}

export function syncLogoSettings() {
  const doc = scope.elements?.settings?.ownerDocument || scope.global.document;
  let field = doc.getElementById('slide-logo-settings');
  if (!field) {
    const container = doc.querySelector('.work-editor__settings-accordion');
    if (!container) return;
    field = doc.createElement('div');
    field.id = 'slide-logo-settings';
    field.className = 'work-editor__settings-field';
    field.dataset.settingsSection = 'logo';
    field.innerHTML = `<figure class="work-editor__logo-preview"><figcaption data-settings-label="preview">预览</figcaption><doe-canvas class="work-editor__logo-preview-frame" mode="static" editable="false"></doe-canvas><small role="status" data-logo-preview-status></small></figure><label data-settings-label="deckLogo">整份 Logo</label>
      <div class="work-editor__settings-actions">
        <button type="button" class="work-editor__settings-apply" data-logo="replace" data-settings-label="replaceImage">更换图片</button>
        <button type="button" class="work-editor__settings-apply" data-logo="brand" data-settings-label="brandLogo">Yrkie Logo</button>
        <button type="button" class="work-editor__settings-apply" data-logo="remove" data-settings-label="removeLogo">移除</button>
      </div>
      <label id="slide-logo-mode-label" data-settings-label="pageLogo">本页 Logo</label>
      <div class="work-editor__custom-select" data-slide-select="logo-mode">
        <button id="slide-logo-mode" type="button" class="work-editor__custom-select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="slide-logo-mode-label slide-logo-mode-value">
          <span id="slide-logo-mode-value" data-select-label>继承整份设置</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
        </button>
        <div class="work-editor__custom-select-menu" role="listbox" aria-hidden="true" aria-labelledby="slide-logo-mode-label">
          <button type="button" role="option" data-value="inherit" data-settings-label="inheritLogo" aria-selected="true">继承整份设置</button>
          <button type="button" role="option" data-value="hide" data-settings-label="hideLogo" aria-selected="false">本页隐藏</button>
          <button type="button" role="option" data-value="replace" data-settings-label="replaceLogo" aria-selected="false">本页替换</button>
        </div>
      </div>
      <button type="button" class="work-editor__settings-apply" data-logo="page-replace" data-settings-label="replacePageLogo">更换本页图片</button>
      <small role="status" data-logo-status></small>`;
    if (scope.runtimeSurface !== 'work') {
      const nativeSelect = doc.createElement('select');
      nativeSelect.id = 'slide-logo-mode';
      nativeSelect.className = 'work-editor__custom-select-trigger';
      nativeSelect.innerHTML = '<option value="inherit">继承整份设置</option><option value="hide">本页隐藏</option><option value="replace">本页替换</option>';
      field.querySelector('[data-slide-select="logo-mode"]').replaceWith(nativeSelect);
      field.querySelector('#slide-logo-mode-label').htmlFor = 'slide-logo-mode';
    }
    container.append(field);
    const report = error => { field.querySelector('[data-logo-status]').textContent = error.message; };
    field.querySelector('[data-logo="replace"]').onclick = () => openPicker(false);
    field.querySelector('[data-logo="page-replace"]').onclick = () => openPicker(true);
    field.querySelector('[data-logo="brand"]').onclick = () => void commitLogo(false, { src: BRAND_LOGO_SRC }).catch(report);
    field.querySelector('[data-logo="remove"]').onclick = () => void commitLogo(false, null).catch(report);
    const select = field.querySelector('[data-slide-select="logo-mode"]');
    if (select) {
    const trigger = select.querySelector('.work-editor__custom-select-trigger');
    trigger.onclick = () => {
      const open = trigger.getAttribute('aria-expanded') !== 'true';
      closeCustomSelects(select);
      if (open) openCustomSelect(select); else closeCustomSelect(select);
    };
    const menu = select.querySelector('.work-editor__custom-select-menu');
    menu.addEventListener('click', event => event.stopPropagation());
    trigger.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault(); closeCustomSelects(select); openCustomSelect(select);
      menu.querySelector('[aria-selected="true"]')?.focus();
    });
    menu.addEventListener('keydown', event => {
      const options = [...menu.querySelectorAll('button:not(:disabled)')];
      const index = options.indexOf(event.target);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options[next]?.focus();
      }
      if (event.key === 'Tab') { event.preventDefault(); closeCustomSelect(select); trigger.focus(); }
    });
    select.querySelectorAll('[data-value]').forEach(option => option.addEventListener('click', () => {
      const mode = option.dataset.value;
      closeCustomSelect(select);
      trigger.focus();
      if (mode === 'replace') { openPicker(true); syncLogoSettings(); }
      else void commitLogo(true, mode === 'hide' ? null : undefined).catch(report);
    }));
    } else {
      field.querySelector('select').onchange = event => {
        const mode = event.target.value;
        if (mode === 'replace') { openPicker(true); syncLogoSettings(); }
        else void commitLogo(true, mode === 'hide' ? null : undefined).catch(report);
      };
    }
  }
  const slide = currentSlide();
  const mode = !slide || !Object.hasOwn(slide, 'logo') ? 'inherit' : slide.logo ? 'replace' : 'hide';
  for (const element of field.querySelectorAll('[data-settings-label]')) element.textContent = label(element.dataset.settingsLabel, element.textContent);
  if (scope.runtimeSurface === 'work') setCustomSelectValue('logo-mode', mode);
  else field.querySelector('select').value = mode;
  for (const control of field.querySelectorAll('button, select')) control.disabled = busy || !!(scope.state.generation || scope.state.hostReadOnly) || !scope.state.activeResult;
  field.querySelector('[data-logo="remove"]').disabled ||= !scope.state.logo;
  for (const action of ['replace', 'page-replace']) field.querySelector(`[data-logo="${action}"]`).disabled ||= !scope.global.DOEContentEditor?.openLogo;
  field.querySelector('[data-logo="page-replace"]').hidden = mode !== 'replace';
  field.querySelector('[data-logo-status]').textContent = scope.elements.canvas.querySelector('.schema-slide-logo[data-load-error]')
    ? label('logoLoadFailed', 'Logo 图片加载失败，请更换图片。') : label('logoHint', '支持 1:1、16:9、4:3 图片，完整保留原比例。');
  void refreshLogoPreview(field);
}
