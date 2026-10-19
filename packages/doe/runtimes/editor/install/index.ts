import { createLogoImageForm } from '../logo-image-form/index.ts';
import { withTooltipForm } from '../../../packages/doe-component/src/shared/chart/tooltip/editor/index.ts';
import '../../../integrations/localization/editor/index.ts';
import { installContentsReplacement } from "../../../packages/doe-component/src/component/contents/contents/editor/replacement/index.ts";
import { t } from "../../../packages/doe-component/src/shared/editor/i18n/index.ts";
import type { ContentEditorBridge, ContentEditorDefinition } from "../../../packages/doe-component/src/shared/editor/types/index.ts";
import { createGroupedBarForm } from "../../../packages/doe-component/src/component/charts/grouped-bar-chart/editor/form/index.ts";
import { createTableForm } from "../../../packages/doe-component/src/component/charts/table/editor/form/index.ts";
import { createLineForm } from "../../../packages/doe-component/src/component/charts/line-chart/editor/form/index.ts";
import { createStackedBarForm } from "../../../packages/doe-component/src/component/charts/stacked-bar-chart/editor/form/index.ts";
import { createRiskMatrixForm } from "../../../packages/doe-component/src/component/charts/risk-matrix/editor/form/index.ts";
import { createWaterfallForm } from "../../../packages/doe-component/src/component/charts/waterfall-chart/editor/form/index.ts";
import { createRadarForm } from "../../../packages/doe-component/src/component/charts/radar-chart/editor/form/index.ts";
import { createDonutForm } from "../../../packages/doe-component/src/component/charts/donut-chart/editor/form/index.ts";
import { openContentSheet } from "../../../packages/doe-canvas/src/panel/sheet/index.ts";
import { createCodeForm } from "../../../packages/doe-component/src/component/base/code-block/editor/form/index.ts";
import { createFormulaForm } from "../../../packages/doe-component/src/component/base/math-formula/editor/form/index.ts";
import { createImageForm } from "../../../packages/doe-component/src/component/base/media/editor/form/index.ts";
import { iconEditor } from "../../../integrations/icon-editor/index.tsx";
import { DOE_COMPONENT_LIBRARY } from "../../../packages/doe-component/src/catalog/index.ts";
import { createProjectImageForm } from "../../../integrations/project-images/form/index.tsx";
import { createProjectImagePreview } from "../../../integrations/project-images/preview/index.ts";

import { createDiagramPanel } from '../../../packages/doe-component/src/component/diagrams/shared/panel.ts';
import { createMindMapForm } from '../../../packages/doe-component/src/component/charts/mind-map/editor.ts';
export const editors: Record<string, ContentEditorDefinition> = {
  'vertical-progress': {get label() { return t('doeInteraction:catalog.vertical-percentage-bars'); },renderer:'verticalProgress',createForm:createDiagramPanel(true)},
  'badge-cards': {get label() { return t('doeInteraction:catalog.staggered-arrow-cards'); },renderer:'badgeCards',createForm:createDiagramPanel(false)},
  'mind-map': { get label() { return t('doeInteraction:catalog.tree-mind-map'); }, renderer: 'mindMap', createForm: createMindMapForm },
  'code-block': { get label() { return t('source.code'); }, renderer: 'code-block', createForm: createCodeForm },
  'math-formula': { get label() { return t('source.math'); }, renderer: 'mathFormula', placement: 'right', createForm: createFormulaForm },
  'image-text': { get label() { return t('source.replace'); }, renderer: 'media', placement: 'right', readOnly: true, createForm: createImageForm },
  media: { get label() { return t('source.replace'); }, renderer: 'media', placement: 'right', readOnly: true, createForm: createImageForm },
  'grouped-bar-chart': { get label() { return t('types.groupedBar'); }, renderer: 'groupedBarChart', createForm: withTooltipForm(createGroupedBarForm, 'grouped-bar-chart') },
  table: { get label() { return t('types.table'); }, renderer: 'dataTable', createForm: createTableForm },
  'line-chart': { get label() { return t('types.line'); }, renderer: 'lineChart', createForm: withTooltipForm(createLineForm, 'line-chart') },
  'stacked-bar-chart': { get label() { return t('types.stackedBar'); }, renderer: 'stackedBarChart', createForm: withTooltipForm(createStackedBarForm, 'stacked-bar-chart') },
  'risk-matrix': { get label() { return t('types.risk'); }, renderer: 'riskMatrix', createForm: withTooltipForm(createRiskMatrixForm, 'risk-matrix') },
  'waterfall-chart': { get label() { return t('types.waterfall'); }, renderer: 'waterfallChart', createForm: withTooltipForm(createWaterfallForm, 'waterfall-chart') },
  'radar-chart': { get label() { return t('types.radar'); }, renderer: 'radarChart', createForm: withTooltipForm(createRadarForm, 'radar-chart') },
  'donut-chart': { get label() { return t('types.donut'); }, renderer: 'donutChart', createForm: withTooltipForm(createDonutForm, 'donut-chart') },
};

/** The host explicitly installs editing; read-only/export surfaces never do. */
export function installContentEditor(frame: HTMLIFrameElement, extensions: Record<string, ContentEditorDefinition> = {}, getSessionId?: () => string): (() => void) | null {
  const runtime = frame.contentWindow as (Window & { DOEContentEditor?: ContentEditorBridge }) | null;
  if (!runtime || runtime.location.origin !== location.origin) return null;
  const registry = { ...editors, ...extensions };
  const root = runtime.document.documentElement;
  if (!root) return null;
  const disposeContents = installContentsReplacement(frame);
  const previous = root.dataset.doeDirectTextEdit;
  root.dataset.doeDirectTextEdit = 'true';
  let close: (() => void) | undefined;
  const bridge: ContentEditorBridge = {
    componentLibrary: DOE_COMPONENT_LIBRARY,
    get labels() { return { edit: t('sheet.title'), replace: t('source.replace'), replaceImage: t('images.replace'), toolbar: t('sheet.title'), changed: t('errors.componentChanged'), overflow: t('errors.layoutOverflow') }; },
    supports: type => Object.hasOwn(registry, type),
    openIcon(request) {
      close?.(); close = openContentSheet(request, iconEditor);
    },
    openLogo(request) {
      const sessionId = getSessionId?.();
      close?.();
      close = openContentSheet({ ...request, type: 'media' }, {
        label: 'Logo', renderer: 'media', placement: 'right',
        createPreview: createProjectImagePreview,
        createForm: (props, onChange) => sessionId
          ? createProjectImageForm(props, onChange, sessionId)
          : createLogoImageForm(props, onChange),
      });
    },
    openBackground: getSessionId ? request => bridge.open({ ...request, type: 'media' }) : undefined,
    open(request) {
      let definition = Object.hasOwn(registry, request.type) ? registry[request.type] : undefined;
      if (!definition) return;
      if (getSessionId && ['media', 'image-text'].includes(request.type)) {
        const sessionId = getSessionId();
        definition = { ...definition, readOnly: false, createPreview: createProjectImagePreview, createForm: (props, onChange) => createProjectImageForm(props, onChange, sessionId) };
      }
      close?.(); close = openContentSheet(request, definition);
    },
  };
  runtime.DOEContentEditor = bridge;
  return () => {
    disposeContents(); close?.();
    if (runtime.DOEContentEditor === bridge) {
      delete runtime.DOEContentEditor;
      if (previous === undefined) delete root.dataset.doeDirectTextEdit; else root.dataset.doeDirectTextEdit = previous;
    }
  };
}
