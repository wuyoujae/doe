import { registeredThemeId } from '@yrkie/doe/packages/doe-theme/src/registry/index.js';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { ConfirmDialog } from './ConfirmDialog';
import {
  canonicalizeSlideSchemaDeckFromStudio,
  projectSlideSchemaDeckForStudio,
  saveSessionSchemaDeck,
  type SessionSchemaDeck,
  type SlideSchemaDeck,
} from '@yrkie/doe/integrations/storage/schema-deck/index.ts';
import { mergeSavedDeck, sameContent } from '@yrkie/doe/integrations/agent-edit/merge/index.ts';
import type { StreamingSlideRender } from '../adapters/streaming';
import {
  reportSessionSchemaDeckLayoutWarning,
  type SchemaDeckLayoutIssue,
} from '../adapters/layout-warnings';
import {
  installYrkieDoeToolbar,
  type YrkieDoeToolbarController,
} from '@yrkie/doe/packages/doe-canvas/src/toolbar/controller/index.ts';
import { toolbarLocale, translateToolbarLabel } from '@yrkie/doe/integrations/localization/toolbar/index.ts';
import { installContentEditor } from '@yrkie/doe/runtimes/editor/install/index.ts';
import { installWorkCanvasLocale } from '@yrkie/doe/integrations/localization/canvas/index.ts';
import { openContentSheet } from '@yrkie/doe/packages/doe-canvas/src/panel/sheet/index.ts';
import { installWorkSettingsSheet } from '@yrkie/doe/integrations/work/settings-sheet/index.ts';
import { createProjectImageForm } from '@yrkie/doe/integrations/project-images/form/index.tsx';
import { createProjectImagePreview } from '@yrkie/doe/integrations/project-images/preview/index.ts';
import { insertionError } from '../toolbar/insertion';
import type { DoeSettingsLabels, DoeSettingsSection } from '../toolbar/settings';

const STUDIO_CHANNEL = 'yrkie-doe-work-editor';
const STUDIO_VERSION = 2;
const STUDIO_PATH = '/yrkie-doe/work-editor/index.html?surface=work&v=20260909-git-render';
const AUTOSAVE_DELAY_MS = 700;
const FLUSH_TIMEOUT_MS = 10_000;
const MAX_LAYOUT_DIAGNOSTIC_PAGES = 200;
const MAX_LAYOUT_DIAGNOSTIC_OVERFLOW = 4_096;
const MAX_LAYOUT_WARNING_DEDUPE_ENTRIES = 640;

type StudioLayoutDiagnosticMessage = {
  channel: typeof STUDIO_CHANNEL;
  version: typeof STUDIO_VERSION;
  type: 'layout-diagnostic';
  issue: SchemaDeckLayoutIssue;
  revision: number;
  index: number;
  total: number;
  overflowX: number;
  overflowY: number;
};

type StudioRuntimeMessage = {
  channel: typeof STUDIO_CHANNEL;
  version: typeof STUDIO_VERSION;
  type: 'ready' | 'active-slide-change' | 'deck-change' | 'deck-state' | 'flush-deck-result' | 'sync-deck-result' | 'generation-state' | 'error' | 'request-slide-delete' | 'insert-component-result' | 'settings-change' | 'view-mode-change';
  mode?: 'single' | 'continuous';
  section?: DoeSettingsSection | null;
  accepted?: boolean;
  index?: number;
  total?: number;
  dirty?: boolean;
  message?: string;
  deck?: unknown;
  generationId?: string;
  status?: 'streaming' | 'rendered' | 'committed' | 'aborted' | 'error';
  readyBlockCount?: number;
  requestId?: string;
  errorCode?: string;
  changeVersion?: number;
  revision?: number;
};

type StudioMessage = StudioRuntimeMessage | StudioLayoutDiagnosticMessage;

type HostMessage = {
  channel: typeof STUDIO_CHANNEL;
  version: typeof STUDIO_VERSION;
  type: 'clear-selection' | 'host-ready' | 'host-visibility' | 'host-read-only' | 'request-deck' | 'flush-deck' | 'set-deck' | 'sync-deck' | 'ack-deck-revision' | 'begin-generation' | 'set-generation-deck' | 'commit-generation' | 'abort-generation' | 'resolve-slide-delete' | 'insert-component' | 'cancel-component-insertion' | 'open-settings' | 'set-view-mode';
  readOnly?: boolean;
  mode?: 'single' | 'continuous';
  viewLabels?: Record<string, string>;
  section?: DoeSettingsSection | null;
  labels?: DoeSettingsLabels;
  name?: string;
  locale?: string;
  slideId?: string;
  media?: { src: string; alt?: string };
  confirmed?: boolean;
  dirty?: boolean;
  deck?: SlideSchemaDeck;
  revision?: number;
  changeVersion?: number;
  activeIndex?: number;
  generationId?: string;
  readyBlockCount?: number;
  updateVersion?: number;
  requestId?: string;
  visible?: boolean;
};

export type WorkSlideStudioSaveState = {
  state: 'idle' | 'saving' | 'saved' | 'error';
  dirty: boolean;
  errorMessage: string | null;
};

export type WorkSlideStudioHandle = {
  setViewMode: (mode: 'single' | 'continuous', labels: Record<string, string>) => void;
  openSettings: (section: DoeSettingsSection | null, locale: string, labels: DoeSettingsLabels) => void;
  insertComponent: (name: string, locale: string) => Promise<void>;
  prepareForAgent: () => Promise<string | null>;
  saveNow: () => Promise<boolean>;
  flushAndSaveForExport: () => Promise<WorkSlideStudioExportPreparation | null>;
};

export type WorkSlideStudioExportPreparation = {
  sourceRevision: number;
};

type PendingFlushRequest = {
  requestId: string;
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
  timer: number;
};

type WorkSlideStudioProps = {
  active?: boolean;
  readOnly?: boolean;
  editorLayout?: 'default' | 'doe-work';
  sessionId: string;
  record: SessionSchemaDeck | null;
  slideRender?: StreamingSlideRender;
  onRenderConsumed?: (generationId: string) => void;
  onDisplayReadyChange?: (ready: boolean) => void;
  onRecordChange: (record: SessionSchemaDeck) => void;
  onThemeChange?: (sessionId: string, themeId: string) => void;
  onSettingsChange?: (section: DoeSettingsSection | null) => void;
  onViewModeChange?: (mode: 'single' | 'continuous') => void;
  onSaveStateChange: (state: WorkSlideStudioSaveState) => void;
};

function isStudioMessage(value: unknown): value is StudioMessage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.channel !== STUDIO_CHANNEL
    || candidate.version !== STUDIO_VERSION
    || typeof candidate.type !== 'string'
  ) {
    return false;
  }
  if (candidate.type === 'layout-diagnostic') {
    return isLayoutDiagnosticMessage(candidate);
  }
  const supportedTypes = new Set<StudioRuntimeMessage['type']>([
    'ready',
    'active-slide-change',
    'deck-change',
    'deck-state',
    'flush-deck-result',
    'sync-deck-result',
    'generation-state',
    'error',
    'request-slide-delete',
    'insert-component-result',
    'settings-change',
    'view-mode-change',
  ]);
  return supportedTypes.has(candidate.type as StudioRuntimeMessage['type']);
}

function isLayoutDiagnosticMessage(
  candidate: Record<string, unknown>,
): candidate is StudioLayoutDiagnosticMessage {
  const allowedKeys = new Set([
    'channel',
    'version',
    'type',
    'issue',
    'revision',
    'index',
    'total',
    'overflowX',
    'overflowY',
  ]);
  const allowedIssues = new Set<SchemaDeckLayoutIssue>([
    'safe-area-overflow',
    'final-paint-overflow',
    'locked-bleed-overflow',
  ]);
  const index = candidate.index;
  const total = candidate.total;
  const revision = candidate.revision;
  const overflowX = candidate.overflowX;
  const overflowY = candidate.overflowY;
  return Object.keys(candidate).every((key) => allowedKeys.has(key))
    && allowedIssues.has(candidate.issue as SchemaDeckLayoutIssue)
    && Number.isSafeInteger(revision)
    && Number(revision) > 0
    && Number.isSafeInteger(index)
    && Number(index) >= 1
    && Number.isSafeInteger(total)
    && Number(total) >= Number(index)
    && Number(total) <= MAX_LAYOUT_DIAGNOSTIC_PAGES
    && isBoundedLayoutOverflow(overflowX)
    && isBoundedLayoutOverflow(overflowY)
    && (Number(overflowX) > 0 || Number(overflowY) > 0);
}

function isBoundedLayoutOverflow(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= MAX_LAYOUT_DIAGNOSTIC_OVERFLOW;
}

export const WorkSlideStudio = forwardRef<WorkSlideStudioHandle, WorkSlideStudioProps>(
  function WorkSlideStudio({
    active = true,
    readOnly = false,
    editorLayout = 'default',
    sessionId,
    record,
    slideRender,
    onRenderConsumed,
    onDisplayReadyChange,
    onRecordChange,
    onThemeChange,
    onSettingsChange,
    onViewModeChange,
    onSaveStateChange,
  }, ref) {
    const { t } = useTranslation('work');
    const readOnlyRef = useRef(readOnly);
    readOnlyRef.current = readOnly;
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const toolbarControllerRef = useRef<YrkieDoeToolbarController | null>(null);
    const disposeContentEditorRef = useRef<(() => void) | null>(null);
    const deckRef = useRef<SlideSchemaDeck | null>(record?.deck ?? null);
    const savedDeckRef = useRef<SlideSchemaDeck | null>(record?.deck ?? null);
    const activeIndexRef = useRef(0);
    const syncPromiseRef = useRef<Promise<void> | null>(null);
    const pendingSyncRef = useRef<{
      requestId: string; record: SessionSchemaDeck; merged: SlideSchemaDeck;
      resolve: () => void; reject: (error: Error) => void; timer: number;
    } | null>(null);
    const persistedRevisionRef = useRef(record?.revision ?? 0);
    const changeVersionRef = useRef(0);
    const runtimeChangeVersionRef = useRef(0);
    const dirtyRef = useRef(false);
    const savePromiseRef = useRef<Promise<boolean> | null>(null);
    const pendingFlushRef = useRef<PendingFlushRequest | null>(null);
    const pendingInsertRef = useRef<{ requestId: string; resolve: () => void; reject: (error: Error) => void; timer: number } | null>(null);
    const insertionBusyRef = useRef(false);
    const insertionSheetRef = useRef<(() => void) | null>(null);
    const insertionContextRef = useRef({ sessionId, active });
    insertionContextRef.current = { sessionId, active };
    const flushRequestSequenceRef = useRef(0);
    const autosaveTimerRef = useRef<number | null>(null);
    const reportedLayoutWarningRef = useRef(new Map<string, true>());
    const layoutWarningInFlightRef = useRef(new Set<string>());
    const mountedRef = useRef(true);
    const callbacksRef = useRef({
      onDisplayReadyChange,
      onRenderConsumed,
      onRecordChange,
      onThemeChange,
      onSettingsChange,
      onViewModeChange,
      onSaveStateChange,
    });
    const slideRenderRef = useRef(slideRender);
    const sentGenerationRef = useRef<{
      generationId: string;
      readyBlockCount: number;
      updateVersion: number;
      status: StreamingSlideRender['status'];
    } | null>(null);
    const pendingGenerationConsumeRef = useRef<{ generationId: string; revision: number } | null>(null);
    const pendingCanonicalRevisionRef = useRef<number | null>(null);
    const [isRuntimeReady, setIsRuntimeReady] = useState(false);
    const [isDeckReady, setIsDeckReady] = useState(false);
    const [canonicalReadyRevision, setCanonicalReadyRevision] = useState<number | null>(null);
    const [generationReadyId, setGenerationReadyId] = useState<string | null>(null);
    const [frameError, setFrameError] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<{ requestId: string; index: number } | null>(null);

    callbacksRef.current = {
      onDisplayReadyChange,
      onRenderConsumed,
      onRecordChange,
      onThemeChange,
      onSettingsChange,
      onViewModeChange,
      onSaveStateChange,
    };
    slideRenderRef.current = slideRender;

    const publishSaveState = useCallback((state: WorkSlideStudioSaveState) => {
      callbacksRef.current.onSaveStateChange(state);
    }, []);

    const postToStudio = useCallback((message: Omit<HostMessage, 'channel' | 'version'>) => {
      const target = iframeRef.current?.contentWindow;
      if (!target) return;
      target.postMessage(
        { channel: STUDIO_CHANNEL, version: STUDIO_VERSION, ...message },
        window.location.origin,
      );
    }, []);

    const resolveSlideDelete = (confirmed: boolean) => {
      if (!pendingDelete) return;
      postToStudio({ type: 'resolve-slide-delete', requestId: pendingDelete.requestId, confirmed: confirmed && !readOnlyRef.current });
      setPendingDelete(null);
    };

    useEffect(() => {
      setPendingDelete(null);
    }, [sessionId, active, slideRender?.generationId, record?.revision]);

    useEffect(() => {
      if (!active) return;
      const clearOnBackground = (event: MouseEvent) => {
        if (event.button !== 0 || !(event.target instanceof Element)) return;
        const shell = iframeRef.current?.closest('.work-shell[data-work-layout="doe-floating"]');
        if (!shell?.contains(event.target)) return;
        if (event.target.matches('.app-body, .main-content, .work-preview-panel:not(.work-doe-preview-controls-host), .work-slide-studio-shell, .work-slide-studio')) {
          postToStudio({ type: 'clear-selection' });
        }
      };
      document.addEventListener('click', clearOnBackground);
      return () => document.removeEventListener('click', clearOnBackground);
    }, [active, postToStudio]);

    const contentEditorSessionRef = useRef(sessionId);
    contentEditorSessionRef.current = sessionId;
    useEffect(() => {
      disposeContentEditorRef.current?.();
      disposeContentEditorRef.current = null;
    }, [sessionId]);
    const ensureToolbarController = useCallback(() => {
      const frame = iframeRef.current;
      if (!frame) return null;
      if (readOnlyRef.current) return null;
      if (!disposeContentEditorRef.current) {
        const disposeEditor = installContentEditor(frame, {}, () => contentEditorSessionRef.current);
        const disposeSettings = installWorkSettingsSheet(frame);
        const disposeLocale = installWorkCanvasLocale(frame);
        disposeContentEditorRef.current = () => { disposeLocale(); disposeSettings(); disposeEditor?.(); };
      }
      const current = toolbarControllerRef.current;
      if (current) {
        current.refresh();
        return current;
      }
      const controller = installYrkieDoeToolbar(frame, toolbarLocale);
      toolbarControllerRef.current = controller;
      return controller;
    }, []);

    const postCanonicalDeck = useCallback((deck: SlideSchemaDeck, revision: number) => {
      pendingCanonicalRevisionRef.current = revision;
      setCanonicalReadyRevision(null);
      postToStudio({
        type: 'set-deck',
        deck: projectSlideSchemaDeckForStudio(deck, sessionId),
        revision,
      });
    }, [postToStudio, sessionId]);

    const committedRenderRevision = slideRender?.status === 'committed'
      && Number.isSafeInteger(slideRender.revision)
      ? slideRender.revision ?? null
      : null;
    const canonicalDisplayReady = Boolean(
      record
      && isRuntimeReady
      && isDeckReady
      && !frameError
      && canonicalReadyRevision === record.revision
      && (
        !slideRender
        || (committedRenderRevision !== null && record.revision >= committedRenderRevision)
      ),
    );
    const generationDisplayReady = Boolean(
      slideRender
      && slideRender.readyBlockCount > 0
      && isRuntimeReady
      && isDeckReady
      && !frameError
      && generationReadyId === slideRender.generationId,
    );
    const isDisplayReady = canonicalDisplayReady || generationDisplayReady;

    useEffect(() => {
      callbacksRef.current.onDisplayReadyChange?.(isDisplayReady);
    }, [isDisplayReady]);

    const saveNow = useCallback(async () => {
      if (syncPromiseRef.current) {
        try { await syncPromiseRef.current; } catch { return false; }
      }
      if (savePromiseRef.current) return savePromiseRef.current;
      if (!dirtyRef.current) return true;
      if (slideRenderRef.current?.status === 'streaming') return false;
      if (!deckRef.current || persistedRevisionRef.current <= 0) return false;

      const promise = (async () => {
        while (dirtyRef.current) {
          const savingVersion = changeVersionRef.current;
          const savingRuntimeChangeVersion = runtimeChangeVersionRef.current;
          const savingDeck = deckRef.current;
          if (!savingDeck) return false;
          publishSaveState({ state: 'saving', dirty: true, errorMessage: null });
          try {
            const saved = await saveSessionSchemaDeck(
              sessionId,
              persistedRevisionRef.current,
              savingDeck,
            );
            if (!mountedRef.current) return true;
            persistedRevisionRef.current = saved.revision;
            savedDeckRef.current = saved.deck;
            postToStudio({
              type: 'ack-deck-revision',
              revision: saved.revision,
              changeVersion: savingRuntimeChangeVersion,
            });
            callbacksRef.current.onRecordChange(saved);
            if (changeVersionRef.current === savingVersion) dirtyRef.current = false;
          } catch (error) {
            if (!mountedRef.current) return false;
            const message = error instanceof Error ? error.message : t('toolbar.saveFailed');
            publishSaveState({ state: 'error', dirty: true, errorMessage: message });
            return false;
          }
        }

        publishSaveState({ state: 'saved', dirty: false, errorMessage: null });
        return true;
      })();
      savePromiseRef.current = promise;
      try {
        return await promise;
      } finally {
        if (savePromiseRef.current === promise) savePromiseRef.current = null;
      }
    }, [postToStudio, publishSaveState, sessionId, t]);

    const scheduleSave = useCallback(() => {
      if (readOnlyRef.current) return;
      if (autosaveTimerRef.current !== null) window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = window.setTimeout(() => {
        autosaveTimerRef.current = null;
        if (!readOnlyRef.current) void saveNow();
      }, AUTOSAVE_DELAY_MS);
    }, [saveNow]);

    const requestFlushedDeck = useCallback(async () => {
      if (!isRuntimeReady || slideRenderRef.current) {
        throw new Error('schema-deck-editor-not-ready');
      }
      if (pendingFlushRef.current) return pendingFlushRef.current.promise;

      flushRequestSequenceRef.current += 1;
      const requestId = `${sessionId}:${flushRequestSequenceRef.current}`;
      let resolveRequest: (() => void) | null = null;
      let rejectRequest: ((error: Error) => void) | null = null;
      const promise = new Promise<void>((resolve, reject) => {
        resolveRequest = resolve;
        rejectRequest = reject;
      });
      const timer = window.setTimeout(() => {
        const pending = pendingFlushRef.current;
        if (!pending || pending.requestId !== requestId) return;
        pendingFlushRef.current = null;
        pending.reject(new Error('schema-deck-flush-timeout'));
      }, FLUSH_TIMEOUT_MS);
      pendingFlushRef.current = {
        requestId,
        promise,
        resolve: resolveRequest!,
        reject: rejectRequest!,
        timer,
      };
      postToStudio({ type: 'flush-deck', requestId });
      return promise;
    }, [isRuntimeReady, postToStudio, sessionId]);

    const flushAndSaveForExport = useCallback(async () => {
      try {
        await requestFlushedDeck();
      } catch (error) {
        publishSaveState({
          state: 'error',
          dirty: dirtyRef.current,
          errorMessage: error instanceof Error ? error.message : 'schema-deck-flush-failed',
        });
        return null;
      }
      const saved = await saveNow();
      if (!saved || persistedRevisionRef.current <= 0) return null;
      return { sourceRevision: persistedRevisionRef.current };
    }, [publishSaveState, requestFlushedDeck, saveNow]);

    const prepareForAgent = useCallback(async () => {
      const saved = await flushAndSaveForExport();
      if (!saved) throw new Error(t('studio.revisionConflict'));
      return deckRef.current?.deck.slides[activeIndexRef.current]?.id ?? null;
    }, [flushAndSaveForExport, t]);

    const cancelInsertion = useCallback(() => {
      insertionSheetRef.current?.(); insertionSheetRef.current = null;
      const pending = pendingInsertRef.current;
      if (pending) {
        pendingInsertRef.current = null;
        window.clearTimeout(pending.timer);
        postToStudio({ type: 'cancel-component-insertion', requestId: pending.requestId });
        pending.reject(new Error('insert-stale'));
      }
    }, [postToStudio]);

    const insertComponent = useCallback(async (name: string, locale: string) => {
      if (insertionBusyRef.current) throw new Error(insertionError('insert-busy', locale));
      if (readOnlyRef.current || !active || !canonicalDisplayReady || slideRenderRef.current) throw new Error(insertionError('insert-not-ready', locale));
      insertionBusyRef.current = true;
      const slideId = deckRef.current?.deck.slides[activeIndexRef.current]?.id;
      const current = () => mountedRef.current && insertionContextRef.current.sessionId === sessionId
        && insertionContextRef.current.active && !slideRenderRef.current && !readOnlyRef.current
        && Boolean(slideId) && deckRef.current?.deck.slides[activeIndexRef.current]?.id === slideId;
      try {
        await syncPromiseRef.current;
        await requestFlushedDeck();
        if (!await saveNow()) throw new Error('insert-unsaved');
        if (!current()) throw new Error('insert-stale');
        const revision = persistedRevisionRef.current;
        const changeVersion = runtimeChangeVersionRef.current;
        const submit = async (media?: { src: string; alt?: string }) => {
          if (!current() || syncPromiseRef.current || revision !== persistedRevisionRef.current || changeVersion !== runtimeChangeVersionRef.current) throw new Error('insert-stale');
          await new Promise<void>((resolve, reject) => {
            const requestId = `${sessionId}:insert:${crypto.randomUUID()}`;
            const timer = window.setTimeout(() => {
              if (pendingInsertRef.current?.requestId !== requestId) return;
              pendingInsertRef.current = null;
              postToStudio({ type: 'cancel-component-insertion', requestId });
              reject(new Error('insert-timeout'));
            }, 30_000);
            pendingInsertRef.current = { requestId, resolve, reject, timer };
            postToStudio({ type: 'insert-component', requestId, name, locale, slideId, revision, changeVersion, media });
          });
          // deck-change precedes the result; the existing save path owns persistence.
          // A failed save remains dirty and retryable, never repeats the insertion.
          await saveNow();
        };
        if (name === 'image' || name === 'image-above-text') {
          const element = iframeRef.current?.contentDocument?.querySelector<HTMLElement>('.doe-canvas')
            ?? iframeRef.current?.contentDocument?.body;
          if (!element) throw new Error('insert-not-ready');
          await new Promise<void>(resolve => {
            insertionSheetRef.current = openContentSheet({ type: 'media', props: { src: '' }, element, apply: async props => {
              try {
                if (typeof props.src !== 'string' || !props.src) throw new Error('insert-media-required');
                await submit({ src: props.src });
              } catch (error) { throw new Error(insertionError(error instanceof Error ? error.message : '')); }
            } }, {
              label: t('doeInteraction:selectImage'), renderer: 'media', placement: 'right',
              createPreview: createProjectImagePreview,
              createForm: (props, onChange) => createProjectImageForm(props, onChange, sessionId),
            }, () => { insertionSheetRef.current = null; resolve(); });
          });
        } else await submit();
      } catch (error) {
        throw new Error(insertionError(error instanceof Error ? error.message : ''));
      } finally { insertionBusyRef.current = false; }
    }, [active, canonicalDisplayReady, postToStudio, requestFlushedDeck, saveNow, sessionId]);

    useEffect(() => () => cancelInsertion(), [cancelInsertion, sessionId]);
    useEffect(() => { if (!active || slideRender || readOnly) cancelInsertion(); }, [active, slideRender, readOnly, cancelInsertion]);
    const openSettings = useCallback((section: DoeSettingsSection | null, locale: string, labels: DoeSettingsLabels) => {
      if (section && (readOnlyRef.current || !active || !canonicalDisplayReady || slideRenderRef.current)) return;
      postToStudio({ type: 'open-settings', section, locale, labels });
    }, [active, canonicalDisplayReady, postToStudio]);
    useEffect(() => {
      if (!active || slideRender || readOnly) {
        postToStudio({ type: 'open-settings', section: null });
        callbacksRef.current.onSettingsChange?.(null);
      }
    }, [active, slideRender, readOnly, postToStudio]);
    const setViewMode = useCallback((mode: 'single' | 'continuous', viewLabels: Record<string, string>) => {
      if (!active || !canonicalDisplayReady || slideRenderRef.current) return;
      postToStudio({ type: 'set-view-mode', mode, viewLabels });
    }, [active, canonicalDisplayReady, postToStudio]);
    useImperativeHandle(ref, () => ({ saveNow, flushAndSaveForExport, prepareForAgent, insertComponent, openSettings, setViewMode }), [flushAndSaveForExport, prepareForAgent, saveNow, insertComponent, openSettings, setViewMode]);

    const handleMessage = useCallback((event: MessageEvent<unknown>) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.origin !== window.location.origin) return;
      if (!isStudioMessage(event.data)) return;
      const message = event.data;
      if (message.type === 'view-mode-change') {
        if (message.mode === 'single' || message.mode === 'continuous') callbacksRef.current.onViewModeChange?.(message.mode);
        return;
      }
      if (message.type === 'settings-change') {
        if (message.section === null || ['theme', 'page-number', 'logo'].includes(message.section ?? '')) {
          callbacksRef.current.onSettingsChange?.(message.section ?? null);
        }
        return;
      }
      if (message.type === 'insert-component-result') {
        const pending = pendingInsertRef.current;
        if (!pending || pending.requestId !== message.requestId) return;
        window.clearTimeout(pending.timer); pendingInsertRef.current = null;
        if (message.accepted === true) pending.resolve();
        else pending.reject(new Error(message.errorCode || 'insert-invalid'));
        return;
      }
      if (message.type === 'request-slide-delete') {
        if (readOnlyRef.current || !active || slideRenderRef.current || typeof message.requestId !== 'string'
          || !message.requestId || !Number.isSafeInteger(message.index) || Number(message.index) < 0) return;
        setPendingDelete({ requestId: message.requestId, index: Number(message.index) });
        return;
      }
      if (message.type === 'layout-diagnostic') {
        const currentDeck = deckRef.current;
        if (
          dirtyRef.current
          || message.revision !== persistedRevisionRef.current
          || !currentDeck
          || message.total !== currentDeck.deck.slides.length
        ) return;
        const dedupeKey = [sessionId, message.revision, message.index, message.issue].join(':');
        const reported = reportedLayoutWarningRef.current;
        const inFlight = layoutWarningInFlightRef.current;
        if (reported.has(dedupeKey) || inFlight.has(dedupeKey)) return;
        inFlight.add(dedupeKey);
        void reportSessionSchemaDeckLayoutWarning(sessionId, {
          expectedRevision: message.revision,
          slideIndex: message.index,
          layoutIssue: message.issue,
          overflowX: message.overflowX,
          overflowY: message.overflowY,
        })
          .then(() => {
            if (!mountedRef.current) return;
            reported.set(dedupeKey, true);
            if (reported.size > MAX_LAYOUT_WARNING_DEDUPE_ENTRIES) {
              const oldest = reported.keys().next().value;
              if (oldest) reported.delete(oldest);
            }
          })
          .catch(() => undefined)
          .finally(() => {
            if (mountedRef.current) inFlight.delete(dedupeKey);
          });
        return;
      }
      if (message.type === 'active-slide-change' || message.type === 'flush-deck-result') {
        if (Number.isSafeInteger(message.index) && Number(message.index) >= 0) activeIndexRef.current = Number(message.index);
      }
      if (message.type === 'sync-deck-result') {
        const pending = pendingSyncRef.current;
        if (!pending || message.requestId !== pending.requestId) return;
        window.clearTimeout(pending.timer);
        pendingSyncRef.current = null;
        if (message.errorCode) { pending.reject(new Error(message.errorCode)); return; }
        persistedRevisionRef.current = pending.record.revision;
        if (Number.isSafeInteger(message.index)) activeIndexRef.current = Number(message.index);
        savedDeckRef.current = pending.record.deck;
        deckRef.current = pending.merged;
        callbacksRef.current.onThemeChange?.(sessionId, registeredThemeId(pending.merged.deck.theme));
        runtimeChangeVersionRef.current = Number(message.changeVersion);
        dirtyRef.current = !sameContent(pending.merged, pending.record.deck);
        setCanonicalReadyRevision(pending.record.revision);
        callbacksRef.current.onRecordChange(pending.record);
        publishSaveState({ state: dirtyRef.current ? 'idle' : 'saved', dirty: dirtyRef.current, errorMessage: null });
        pending.resolve();
        if (dirtyRef.current) scheduleSave();
        return;
      }
      if (message.type === 'error') {
        setFrameError(message.message ? translateToolbarLabel(message.message) : t('studio.loadFailed'));
        return;
      }
      if (message.type === 'ready') {
        postToStudio({ type: 'host-read-only', readOnly: readOnlyRef.current });
        ensureToolbarController();
        setIsRuntimeReady(true);
        setFrameError(null);
        if (deckRef.current && !slideRenderRef.current) {
          runtimeChangeVersionRef.current = 0;
          postCanonicalDeck(deckRef.current, persistedRevisionRef.current);
        }
        return;
      }
      if (message.type === 'generation-state') {
        const current = slideRenderRef.current;
        if (!current || message.generationId !== current.generationId) return;
        if (
          message.status === 'rendered'
          || (message.status === 'committed' && Number(message.readyBlockCount) > 0)
        ) {
          setIsDeckReady(true);
          setGenerationReadyId(current.generationId);
          setFrameError(null);
        } else if (message.status === 'error' && generationReadyId !== current.generationId) {
          setFrameError(message.message ? translateToolbarLabel(message.message) : t('studio.loadFailed'));
        }
        return;
      }
      if (message.type === 'flush-deck-result') {
        const pending = pendingFlushRef.current;
        if (!pending || message.requestId !== pending.requestId) return;
        window.clearTimeout(pending.timer);
        pendingFlushRef.current = null;
        if (message.errorCode) {
          pending.reject(new Error(message.errorCode));
          return;
        }
        if (
          message.revision !== persistedRevisionRef.current
          ||
          !Number.isSafeInteger(message.changeVersion)
          || Number(message.changeVersion) < runtimeChangeVersionRef.current
        ) {
          pending.reject(new Error('schema-deck-flush-stale'));
          return;
        }
        try {
          const flushedDeck = canonicalizeSlideSchemaDeckFromStudio(message.deck, sessionId);
          const hasRuntimeEdits = message.dirty === true
            || Number(message.changeVersion) > runtimeChangeVersionRef.current;
          runtimeChangeVersionRef.current = Number(message.changeVersion);
          // Clean renders add editor/layout metadata; they are not unsaved user edits.
          if (hasRuntimeEdits && !sameContent(flushedDeck, deckRef.current)) {
            deckRef.current = flushedDeck;
            callbacksRef.current.onThemeChange?.(sessionId, registeredThemeId(flushedDeck.deck.theme));
            changeVersionRef.current += 1;
            dirtyRef.current = true;
            publishSaveState({ state: 'idle', dirty: true, errorMessage: null });
          }
          pending.resolve();
        } catch (error) {
          pending.reject(error instanceof Error ? error : new Error('schema-deck-flush-invalid'));
        }
        return;
      }
      if (message.type === 'deck-state' && !message.dirty) {
        if (message.revision !== persistedRevisionRef.current || persistedRevisionRef.current <= 0) return;
        ensureToolbarController();
        setIsDeckReady(true);
        setFrameError(null);
        const reportedRevision = Number(message.revision);
        if (reportedRevision === persistedRevisionRef.current) {
          pendingCanonicalRevisionRef.current = null;
          setCanonicalReadyRevision(reportedRevision);
          const pendingConsume = pendingGenerationConsumeRef.current;
          if (pendingConsume && pendingConsume.revision <= reportedRevision) {
            pendingGenerationConsumeRef.current = null;
            sentGenerationRef.current = null;
            setGenerationReadyId(null);
            callbacksRef.current.onRenderConsumed?.(pendingConsume.generationId);
          }
        }
        return;
      }
      if (message.type !== 'deck-change' || !message.dirty || slideRenderRef.current) return;
      if (message.revision !== persistedRevisionRef.current || persistedRevisionRef.current <= 0) return;

      if (
        !Number.isSafeInteger(message.changeVersion)
        || Number(message.changeVersion) <= runtimeChangeVersionRef.current
      ) return;

      try {
        deckRef.current = canonicalizeSlideSchemaDeckFromStudio(message.deck, sessionId);
        callbacksRef.current.onThemeChange?.(sessionId, registeredThemeId(deckRef.current.deck.theme));
        runtimeChangeVersionRef.current = Number(message.changeVersion);
        changeVersionRef.current += 1;
        dirtyRef.current = true;
        publishSaveState({ state: 'idle', dirty: true, errorMessage: null });
        scheduleSave();
      } catch (error) {
        publishSaveState({
          state: 'error',
          dirty: true,
          errorMessage: error instanceof Error ? error.message : t('toolbar.saveFailed'),
        });
      }
    }, [active, ensureToolbarController, generationReadyId, postCanonicalDeck, postToStudio, publishSaveState, scheduleSave, sessionId, t]);

    useEffect(() => {
      postToStudio({ type: 'host-read-only', readOnly });
      if (readOnly) {
        if (autosaveTimerRef.current !== null) window.clearTimeout(autosaveTimerRef.current);
        setPendingDelete(null);
        toolbarControllerRef.current?.dispose();
        toolbarControllerRef.current = null;
        disposeContentEditorRef.current?.();
        disposeContentEditorRef.current = null;
      } else if (isRuntimeReady) {
        ensureToolbarController();
        if (dirtyRef.current) scheduleSave();
      }
    }, [readOnly, isRuntimeReady, ensureToolbarController, postToStudio, scheduleSave]);

    useEffect(() => {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    useEffect(() => {
      if (isRuntimeReady || frameError) return undefined;
      postToStudio({ type: 'host-ready' });
      const timer = window.setInterval(() => postToStudio({ type: 'host-ready' }), 500);
      return () => window.clearInterval(timer);
    }, [frameError, isRuntimeReady, postToStudio]);

    useEffect(() => {
      if (!isRuntimeReady) return;
      postToStudio({ type: 'host-visibility', visible: active });
    }, [active, isRuntimeReady, postToStudio]);

    useEffect(() => {
      if (isDeckReady || frameError) return undefined;
      const timer = window.setTimeout(() => setFrameError(t('studio.loadFailed')), 30_000);
      return () => window.clearTimeout(timer);
    }, [frameError, isDeckReady, t]);

    useEffect(() => {
      if (!record || record.revision <= persistedRevisionRef.current) return;
      if (!isRuntimeReady || !savedDeckRef.current || slideRenderRef.current) {
        persistedRevisionRef.current = record.revision;
        savedDeckRef.current = record.deck;
        deckRef.current = record.deck;
        runtimeChangeVersionRef.current = 0;
        if (!slideRenderRef.current) postCanonicalDeck(record.deck, record.revision);
        return;
      }
      const previous = syncPromiseRef.current;
      const saving = savePromiseRef.current;
      const sync = (async () => {
        await previous?.catch(() => undefined);
        await saving;
        if (!mountedRef.current || record.revision <= persistedRevisionRef.current) return;
        if (autosaveTimerRef.current !== null) window.clearTimeout(autosaveTimerRef.current);
        await requestFlushedDeck();
        if (!mountedRef.current || !deckRef.current || !savedDeckRef.current) return;
        const merged = mergeSavedDeck(savedDeckRef.current, deckRef.current, record.deck);
        await new Promise<void>((resolve, reject) => {
          const requestId = `${sessionId}:sync:${++flushRequestSequenceRef.current}`;
          const timer = window.setTimeout(() => {
            if (pendingSyncRef.current?.requestId === requestId) pendingSyncRef.current = null;
            reject(new Error('schema-deck-sync-timeout'));
          }, 15_000);
          pendingSyncRef.current = { requestId, record, merged, resolve, reject, timer };
          postToStudio({ type: 'sync-deck', requestId, revision: record.revision,
            changeVersion: runtimeChangeVersionRef.current,
            dirty: !sameContent(merged, record.deck), deck: projectSlideSchemaDeckForStudio(merged, sessionId) });
        });
      })();
      syncPromiseRef.current = sync;
      void sync.catch(() => publishSaveState({ state: 'error', dirty: dirtyRef.current, errorMessage: t('studio.revisionConflict') }))
        .finally(() => { if (syncPromiseRef.current === sync) syncPromiseRef.current = null; });
    }, [isRuntimeReady, postCanonicalDeck, postToStudio, publishSaveState, record, requestFlushedDeck, sessionId, t]);

    useEffect(() => {
      if (!isRuntimeReady || !record || slideRender?.status !== 'committed') return;
      if (!Number.isSafeInteger(slideRender.revision) || record.revision < (slideRender.revision ?? 0)) {
        return;
      }
      const revision = slideRender.revision as number;
      pendingGenerationConsumeRef.current = {
        generationId: slideRender.generationId,
        revision,
      };
      runtimeChangeVersionRef.current = 0;
      postCanonicalDeck(record.deck, record.revision);
    }, [isRuntimeReady, postCanonicalDeck, record, slideRender]);

    useEffect(() => {
      if (!isRuntimeReady) return;
      if (
        slideRender?.status === 'committed'
        && Number.isSafeInteger(slideRender.revision)
        && record
        && record.revision >= (slideRender.revision ?? 0)
      ) return;
      const sent = sentGenerationRef.current;
      if (!slideRender) {
        if (sent && record) {
          // A completed stream can disappear before its committed event reaches Work.
          // The persisted project must replace the preview, never the runtime baseline.
          runtimeChangeVersionRef.current = 0;
          postCanonicalDeck(record.deck, record.revision);
        } else if (sent?.status === 'streaming') {
          postToStudio({ type: 'abort-generation', generationId: sent.generationId });
        }
        sentGenerationRef.current = null;
        setGenerationReadyId(null);
        return;
      }
      const projectedDeck = projectSlideSchemaDeckForStudio(slideRender.deck, sessionId);
      if (!sent || sent.generationId !== slideRender.generationId) {
        setGenerationReadyId(null);
        postToStudio({
          type: 'begin-generation',
          generationId: slideRender.generationId,
        });
      }
      if (
        !sent
        || sent.generationId !== slideRender.generationId
        || sent.updateVersion < slideRender.updateVersion
      ) {
        postToStudio({
          type: 'set-generation-deck',
          generationId: slideRender.generationId,
          readyBlockCount: slideRender.readyBlockCount,
          updateVersion: slideRender.updateVersion,
          deck: projectedDeck,
        });
      }
      if (slideRender.status === 'committed' && sent?.status !== 'committed') {
        postToStudio({
          type: 'commit-generation',
          generationId: slideRender.generationId,
        });
      }
      sentGenerationRef.current = {
        generationId: slideRender.generationId,
        readyBlockCount: slideRender.readyBlockCount,
        updateVersion: slideRender.updateVersion,
        status: slideRender.status,
      };
    }, [isRuntimeReady, postCanonicalDeck, postToStudio, record, sessionId, slideRender]);

    useEffect(() => {
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (!dirtyRef.current) return;
        event.preventDefault();
        event.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    useEffect(() => {
      mountedRef.current = true;
      publishSaveState({ state: 'idle', dirty: false, errorMessage: null });
      return () => {
        mountedRef.current = false;
        const sync = pendingSyncRef.current;
        if (sync) { window.clearTimeout(sync.timer); pendingSyncRef.current = null; sync.reject(new Error('schema-deck-editor-unmounted')); }
        toolbarControllerRef.current?.dispose();
        toolbarControllerRef.current = null;
        disposeContentEditorRef.current?.();
        disposeContentEditorRef.current = null;
        if (autosaveTimerRef.current !== null) window.clearTimeout(autosaveTimerRef.current);
        const pending = pendingFlushRef.current;
        if (pending) {
          window.clearTimeout(pending.timer);
          pendingFlushRef.current = null;
          pending.reject(new Error('schema-deck-editor-unmounted'));
        }
      };
    }, [publishSaveState]);

    return (
      <section className="work-slide-studio" aria-label={t('studio.editorAria')}>
        {!isDeckReady && !frameError ? (
          <div className="work-slide-studio__loading">{t('studio.loading')}</div>
        ) : null}
        {frameError ? (
          <div className="work-slide-studio__error" role="alert">{translateToolbarLabel(frameError)}</div>
        ) : null}
        <iframe
          ref={iframeRef}
          className="work-slide-studio__frame"
          src={editorLayout === 'doe-work' ? `${STUDIO_PATH}&layout=doe-work` : STUDIO_PATH}
          title={t('studio.iframeTitle')}
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => {
            callbacksRef.current.onViewModeChange?.('single');
            cancelInsertion();
            setPendingDelete(null);
            const sync = pendingSyncRef.current;
            if (sync) { window.clearTimeout(sync.timer); pendingSyncRef.current = null; sync.reject(new Error('schema-deck-editor-reloaded')); }
            toolbarControllerRef.current?.dispose();
            toolbarControllerRef.current = null;
            disposeContentEditorRef.current?.();
            disposeContentEditorRef.current = null;
            ensureToolbarController();
            const pending = pendingFlushRef.current;
            if (pending) {
              window.clearTimeout(pending.timer);
              pendingFlushRef.current = null;
              pending.reject(new Error('schema-deck-editor-reloaded'));
            }
            setIsRuntimeReady(false);
            setIsDeckReady(false);
            setCanonicalReadyRevision(null);
            setGenerationReadyId(null);
            sentGenerationRef.current = null;
            pendingCanonicalRevisionRef.current = null;
            setFrameError(null);
            postToStudio({ type: 'host-ready' });
          }}
          onError={() => {
            setCanonicalReadyRevision(null);
            setFrameError(t('studio.loadFailed'));
          }}
        />
        {pendingDelete && createPortal(
          <ConfirmDialog
            open
            title={t('slideActions.deleteTitle', { number: pendingDelete.index + 1 })}
            description={t('slideActions.deleteDescription')}
            confirmLabel={t('slideActions.delete')}
            tone="danger"
            onCancel={() => resolveSlideDelete(false)}
            onConfirm={() => resolveSlideDelete(true)}
          />,
          iframeRef.current?.closest('.work-shell') ?? document.body,
        )}
      </section>
    );
  },
);
