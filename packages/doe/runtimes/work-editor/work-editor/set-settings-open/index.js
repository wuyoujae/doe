import { setSettingsSection as __doeFn_setSettingsSection } from '../set-settings-section/index.js';
import { closeCustomSelects as __doeFn_closeCustomSelects } from '../close-custom-selects/index.js';
import { syncSlideSettings } from '../sync-slide-settings/index.js';
import { post } from '../post/index.js';
import { setCustomSelectValue } from '../set-custom-select-value/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:983
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function setSettingsOpen(open, { focusTrigger = false, section, locale, labels: inputLabels } = {}) {
    if (open && ((__doeScope.state.generation || __doeScope.state.hostReadOnly) || !__doeScope.state.activeResult)) return;
    const work = __doeScope.runtimeSurface === 'work';
    if (work && !open) {
      (0, __doeFn_closeCustomSelects)();
      __doeScope.global.DOEWorkSettings?.close();
    }
    if (inputLabels && typeof inputLabels === 'object' && !Array.isArray(inputLabels)) {
      __doeScope.state.settingsLabels = Object.fromEntries(Object.entries(inputLabels).filter(([key, value]) => typeof value === 'string' && value.length < 1000));
    }
    if (locale) __doeScope.state.settingsLocale = locale;
    __doeScope.state.settingsOpen = Boolean(open);
    __doeScope.elements.settings.closest(".work-editor__stage")?.classList.toggle(
      "is-settings-open",
      __doeScope.state.settingsOpen,
    );
    __doeScope.elements.settingsTrigger?.setAttribute("aria-expanded", String(__doeScope.state.settingsOpen));
    __doeScope.elements.settingsPanel?.setAttribute("aria-hidden", String(!__doeScope.state.settingsOpen));
    if (work) {
      __doeScope.elements.settingsPanel.inert = !open;
      __doeScope.elements.settingsBackdrop.hidden = !open;
      const nextSection = ['theme', 'page-number', 'logo'].includes(section) ? section : (__doeScope.state.settingsSection || 'theme');
      if (open) {
        const ui = __doeScope.global.parent.getComputedStyle(__doeScope.global.parent.document.documentElement);
        for (const name of ['--yrkie-motion-panel', '--yrkie-ease-control', '--yrkie-color-white', '--yrkie-color-ink', '--yrkie-color-control-border', '--yrkie-color-task-hover', '--yrkie-font-ui', '--yrkie-text-body', '--yrkie-text-label', '--yrkie-gap-icon', '--yrkie-gap-content', '--yrkie-gap-section', '--yrkie-radius-panel', '--yrkie-shadow-select']) {
          const value = ui.getPropertyValue(name).trim();
          if (value) __doeScope.elements.settingsPanel.style.setProperty(name, value);
        }
        (0, __doeFn_setSettingsSection)(nextSection);
        syncSlideSettings();
        (0, __doeFn_setSettingsSection)(nextSection);
        const labels = __doeScope.state.settingsLabels || {};
        __doeScope.elements.settingsPanel.querySelectorAll('[data-settings-label]').forEach(element => {
          const text = labels[element.dataset.settingsLabel];
          if (text) element.textContent = text;
        });
        __doeScope.elements.settingsPanel.querySelectorAll('[data-slide-select]').forEach(select => {
          setCustomSelectValue(select.dataset.slideSelect, select.querySelector('.work-editor__custom-select-trigger').dataset.value);
        });
        __doeScope.elements.settingsTitle.textContent = labels[nextSection === 'page-number' ? 'pageNumber' : nextSection] || ({ theme: 'Theme', 'page-number': '页码', logo: 'Logo' })[nextSection];
        __doeScope.elements.settingsClose.setAttribute('aria-label', labels.close || '关闭');
        __doeScope.elements.settingsBackdrop.setAttribute('aria-label', labels.close || '关闭');
        __doeScope.elements.settingsPanel.querySelector('.work-editor__settings-accordion').scrollTop = 0;
        const sheet = __doeScope.global.DOEWorkSettings;
        if (sheet) {
          __doeScope.elements.settingsPanel.setAttribute('role', 'region');
          sheet.open({
            element: __doeScope.elements.settings,
            title: __doeScope.elements.settingsTitle.textContent,
            closeLabel: labels.close || '关闭',
            onClose: () => setSettingsOpen(false, { focusTrigger: true }),
            onReady: () => {
              syncSlideSettings();
              __doeScope.elements.settings.ownerDocument.defaultView.addEventListener('resize', () => (0, __doeFn_closeCustomSelects)());
            },
            onEscape: () => {
              const select = __doeScope.elements.settings.querySelector('.work-editor__custom-select-trigger[aria-expanded="true"]');
              if (select) { (0, __doeFn_closeCustomSelects)(); select.focus(); }
              else setSettingsOpen(false, { focusTrigger: true });
            },
          });
        } else __doeScope.elements.settingsClose.focus({ preventScroll: true });
      }
      post('settings-change', { section: open ? nextSection : null, focusTrigger });
    }
    if (!__doeScope.state.settingsOpen) {
      (0, __doeFn_setSettingsSection)(null);
      (0, __doeFn_closeCustomSelects)();
      if (focusTrigger) __doeScope.elements.settingsTrigger?.focus();
    }
  }
