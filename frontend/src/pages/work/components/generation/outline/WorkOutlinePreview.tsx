import { AlertTriangle, CircleAlert, GripVertical, Trash2 } from 'lucide-react';
import { Fragment, forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import outlineEmptyImage from './outline-empty.png';
import { areOutlineCardsEqual, isDoeOutlineImageReference, moveOutlineCardToIndex, sessionOutlineToCards, visibleOutlineContents } from './helpers';
import { useDampedOutlineAutoScroll } from './useDampedOutlineAutoScroll';
import type { SessionOutlineRecord, WorkOutlineCard, WorkOutlineDragState, WorkOutlinePreviewHandle, WorkOutlineToolbarState } from './types';
import './outline.css';
export type { SessionOutlineRecord, WorkOutlineCard, WorkOutlinePreviewHandle, WorkOutlineToolbarState } from './types';
const noopOutlineToolbarStateChange = (_state: WorkOutlineToolbarState) => undefined;

// Server saves renumber pages and normalize display text; content and stable page IDs own identity.
function sameStoredContents(left: WorkOutlineCard[], right: WorkOutlineCard[]) {
  return left.length === right.length && left.every((card, index) => {
    const other = right[index];
    return other && card.id === other.id && card.contents.length === other.contents.length
      && card.contents.every((content, contentIndex) => content === other.contents[contentIndex]);
  });
}

type WorkOutlinePreviewProps = {
  outline: SessionOutlineRecord | null;
  isOutlineLoading: boolean;
  outlineLoadError: string | null;
  readOnly: boolean;
  streamingDraft?: boolean;
  onSave: (cards: WorkOutlineCard[], expectedRevision: number) => Promise<SessionOutlineRecord>;
  onToolbarStateChange?: (state: WorkOutlineToolbarState) => void;
  artifactKind?: 'presentation' | 'social-card';
  hideDoeImageReferences?: boolean;
};

function AutoGrowTextarea({ value, ...props }: ComponentPropsWithoutRef<'textarea'>) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    const styles = window.getComputedStyle(textarea);
    const borderHeight = Number.parseFloat(styles.borderTopWidth) + Number.parseFloat(styles.borderBottomWidth);
    textarea.style.height = `${textarea.scrollHeight + borderHeight}px`;
  }, [value]);

  return <textarea ref={textareaRef} value={value} rows={1} {...props} />;
}

export const WorkOutlinePreview = forwardRef<WorkOutlinePreviewHandle, WorkOutlinePreviewProps>(function WorkOutlinePreview({
  outline,
  isOutlineLoading,
  outlineLoadError,
  readOnly,
  streamingDraft = false,
  onSave,
  onToolbarStateChange = noopOutlineToolbarStateChange,
  artifactKind = 'presentation',
  hideDoeImageReferences = false,
}, ref) {
  const { t } = useTranslation('work');
  const [outlineCards, setOutlineCards] = useState<WorkOutlineCard[]>([]);
  const [history, setHistory] = useState<WorkOutlineCard[][]>([]);
  const [future, setFuture] = useState<WorkOutlineCard[][]>([]);
  const [confirmedCards, setConfirmedCards] = useState<WorkOutlineCard[]>([]);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dragState, setDragState] = useState<WorkOutlineDragState | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [pendingDeleteCard, setPendingDeleteCard] = useState<WorkOutlineCard | null>(null);
  const outlineCardsRef = useRef<WorkOutlineCard[]>([]);
  const persistedCardsRef = useRef<WorkOutlineCard[]>([]);
  const historyRef = useRef<WorkOutlineCard[][]>([]);
  const futureRef = useRef<WorkOutlineCard[][]>([]);
  const editingSnapshotRef = useRef<WorkOutlineCard[] | null>(null);
  const dragStateRef = useRef<WorkOutlineDragState | null>(null);
  const pendingDragRef = useRef<WorkOutlineDragState | null>(null);
  const revisionRef = useRef(0);
  const lastSavedOutlineRef = useRef<SessionOutlineRecord | null>(null);
  const savePromiseRef = useRef<Promise<SessionOutlineRecord | null> | null>(null);
  const savingCardsRef = useRef<WorkOutlineCard[] | null>(null);
  const uncertainCardsRef = useRef<WorkOutlineCard[] | null>(null);
  const conflictRef = useRef(false);
  const outlineListRef = useDampedOutlineAutoScroll<HTMLDivElement>(streamingDraft, outlineCards);

  useLayoutEffect(() => {
    const nextCards = outline?.body?.length || outline?.cards?.length
      ? sessionOutlineToCards(
          outline,
          t(artifactKind === 'social-card' ? 'socialCard.defaultItem' : 'defaults.slide'),
          hideDoeImageReferences,
        )
      : [];

    if (outline && outline.outlineId === lastSavedOutlineRef.current?.outlineId) {
      const uncertain = uncertainCardsRef.current;
      if (!conflictRef.current && uncertain && sameStoredContents(nextCards, uncertain)) {
        // Only an exact authoritative match acknowledges a response that was lost.
        persistedCardsRef.current = uncertain;
        uncertainCardsRef.current = null;
        revisionRef.current = Math.max(revisionRef.current, outline.revision);
        lastSavedOutlineRef.current = outline;
        setConfirmedCards(uncertain);
        setSaveState('saved');
        setSaveError(null);
        return;
      }
      // Polling and our own save acknowledgement must not erase edits typed while saving.
      if (sameStoredContents(nextCards, persistedCardsRef.current)
        || (savingCardsRef.current && sameStoredContents(nextCards, savingCardsRef.current))) {
        if (!conflictRef.current) {
          revisionRef.current = Math.max(revisionRef.current, outline.revision);
          lastSavedOutlineRef.current = outline;
        }
        return;
      }
      if (savePromiseRef.current || !areOutlineCardsEqual(outlineCardsRef.current, persistedCardsRef.current)) {
        // The parent offers an explicit reload/remount; a poll never discards a dirty draft.
        conflictRef.current = true;
        setSaveState('error');
        setSaveError(t('generation:conflict'));
        return;
      }
    }

    conflictRef.current = false;
    uncertainCardsRef.current = null;
    outlineCardsRef.current = nextCards;
    persistedCardsRef.current = nextCards;
    historyRef.current = [];
    futureRef.current = [];
    editingSnapshotRef.current = null;
    setOutlineCards(nextCards);
    setConfirmedCards(nextCards);
    setHistory([]);
    setFuture([]);
    setEditingCardId(null);
    setPendingDeleteCard(null);
    revisionRef.current = outline?.revision ?? 0;
    lastSavedOutlineRef.current = outline;
    setSaveState('idle');
    setSaveError(null);
  }, [artifactKind, hideDoeImageReferences, outline, t]);

  useEffect(() => {
    onToolbarStateChange({
      slideCount: outlineCards.length,
      canUndo: history.length > 0,
      canRedo: future.length > 0,
      hasPendingChanges: !areOutlineCardsEqual(outlineCards, confirmedCards),
      saveState,
      errorMessage: saveError,
    });
  }, [confirmedCards, future.length, history.length, onToolbarStateChange, outlineCards, saveError, saveState]);

  useEffect(() => {
    if (!pendingDeleteCard) return undefined;

    const closeDeleteDialog = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setPendingDeleteCard(null);
    };

    document.addEventListener('keydown', closeDeleteDialog);
    return () => document.removeEventListener('keydown', closeDeleteDialog);
  }, [pendingDeleteCard]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  const replaceOutlineCards = useCallback((nextCards: WorkOutlineCard[]) => {
    outlineCardsRef.current = nextCards;
    setOutlineCards(nextCards);
  }, []);

  const replaceHistory = useCallback((nextHistory: WorkOutlineCard[][]) => {
    historyRef.current = nextHistory;
    setHistory(nextHistory);
  }, []);

  const replaceFuture = useCallback((nextFuture: WorkOutlineCard[][]) => {
    futureRef.current = nextFuture;
    setFuture(nextFuture);
  }, []);

  const applyOutlineChange = useCallback((nextCards: WorkOutlineCard[]) => {
    if (readOnly) return;
    const currentCards = outlineCardsRef.current;
    if (areOutlineCardsEqual(currentCards, nextCards)) return;

    replaceHistory([...historyRef.current, currentCards].slice(-50));
    replaceFuture([]);
    replaceOutlineCards(nextCards);
  }, [readOnly, replaceFuture, replaceHistory, replaceOutlineCards]);

  const finishEditing = useCallback(() => {
    const snapshot = editingSnapshotRef.current;
    if (snapshot && !areOutlineCardsEqual(snapshot, outlineCardsRef.current)) {
      replaceHistory([...historyRef.current, snapshot].slice(-50));
      replaceFuture([]);
    }
    editingSnapshotRef.current = null;
    setEditingCardId(null);
  }, [replaceFuture, replaceHistory]);

  const undo = useCallback(() => {
    if (readOnly) return;
    finishEditing();
    const currentHistory = historyRef.current;
    const previousCards = currentHistory[currentHistory.length - 1];
    if (!previousCards) return;

    replaceHistory(currentHistory.slice(0, -1));
    replaceFuture([outlineCardsRef.current, ...futureRef.current].slice(0, 50));
    replaceOutlineCards(previousCards);
  }, [finishEditing, readOnly, replaceFuture, replaceHistory, replaceOutlineCards]);

  const redo = useCallback(() => {
    if (readOnly) return;
    finishEditing();
    const [nextCards, ...remainingFuture] = futureRef.current;
    if (!nextCards) return;

    replaceHistory([...historyRef.current, outlineCardsRef.current].slice(-50));
    replaceFuture(remainingFuture);
    replaceOutlineCards(nextCards);
  }, [finishEditing, readOnly, replaceFuture, replaceHistory, replaceOutlineCards]);

  const saveNow = useCallback(async function persistOutline(): Promise<SessionOutlineRecord | null> {
    // Flush callers must await an admitted write even when the parent has locked editing.
    // The ref contains only the HTTP operation, never this recursive flush promise.
    while (savePromiseRef.current) await savePromiseRef.current;
    if (readOnly || !outline) return lastSavedOutlineRef.current;
    if (conflictRef.current) throw new Error(t('generation:conflict'));
    finishEditing();
    const snapshot = outlineCardsRef.current;
    if (areOutlineCardsEqual(snapshot, persistedCardsRef.current)) {
      return lastSavedOutlineRef.current;
    }
    setSaveState('saving');
    setSaveError(null);
    savingCardsRef.current = snapshot;
    const operation = onSave(snapshot, revisionRef.current)
      .then((saved) => {
        if (conflictRef.current) throw new Error(t('generation:conflict'));
        revisionRef.current = Math.max(revisionRef.current, saved.revision);
        lastSavedOutlineRef.current = saved;
        persistedCardsRef.current = snapshot;
        uncertainCardsRef.current = null;
        setConfirmedCards(snapshot);
        setSaveState('saved');
        return saved;
      })
      .catch((error: unknown) => {
        const definitive = error !== null && typeof error === 'object' && 'status' in error
          && typeof error.status === 'number' && error.status >= 400 && error.status < 500;
        uncertainCardsRef.current = definitive ? null : snapshot;
        const message = error instanceof Error ? error.message : String(error);
        setSaveState('error');
        setSaveError(message);
        throw error;
      })
      .finally(() => {
        savePromiseRef.current = null;
        savingCardsRef.current = null;
      });
    savePromiseRef.current = operation;
    const saved = await operation;
    if (!areOutlineCardsEqual(outlineCardsRef.current, snapshot)) {
      return persistOutline();
    }
    return saved;
  }, [finishEditing, onSave, outline, readOnly, t]);

  useEffect(() => {
    if (readOnly || !outline || conflictRef.current || areOutlineCardsEqual(outlineCards, persistedCardsRef.current)) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      void saveNow().catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [outline, outlineCards, readOnly, saveNow]);

  useImperativeHandle(ref, () => ({ undo, redo, saveNow }), [redo, saveNow, undo]);

  useEffect(() => {
    if (!editingCardId) return undefined;

    const finishEditingOutsideCard = (event: globalThis.PointerEvent) => {
      if (!(event.target instanceof Element)) return;

      const selectedCard = event.target.closest<HTMLElement>('.work-outline-card[data-outline-card-id]');
      if (selectedCard?.dataset.outlineCardId === editingCardId) return;

      finishEditing();
    };

    document.addEventListener('pointerdown', finishEditingOutsideCard, true);
    return () => document.removeEventListener('pointerdown', finishEditingOutsideCard, true);
  }, [editingCardId, finishEditing]);

  useEffect(() => {
    if (!dragState?.id) return;

    const getDropIndex = (clientY: number, draggedId: string) => {
      const cardElements = Array.from(document.querySelectorAll<HTMLElement>('.work-outline-card[data-outline-card-id]'))
        .filter((element) => element.dataset.outlineCardId !== draggedId);

      const hoveredIndex = cardElements.findIndex((element) => {
        const rect = element.getBoundingClientRect();
        return clientY < rect.top + rect.height / 2;
      });

      return hoveredIndex === -1 ? cardElements.length : hoveredIndex;
    };

    const handleWindowMove = (event: globalThis.MouseEvent | globalThis.PointerEvent) => {
      event.preventDefault();
      setDragState((current) => {
        if (!current) return current;

        const nextState = {
          ...current,
          pointerX: event.clientX,
          pointerY: event.clientY,
          dropIndex: getDropIndex(event.clientY, current.id),
        };

        dragStateRef.current = nextState;
        return nextState;
      });
    };

    const finishDrag = () => {
      const current = dragStateRef.current;

      if (!current) return;

      dragStateRef.current = null;
      applyOutlineChange(moveOutlineCardToIndex(outlineCardsRef.current, current.id, current.dropIndex));
      setDragState(null);
    };

    const cancelDrag = () => {
      dragStateRef.current = null;
      setDragState(null);
    };

    window.addEventListener('pointermove', handleWindowMove);
    window.addEventListener('mousemove', handleWindowMove);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('mouseup', finishDrag);
    window.addEventListener('pointercancel', cancelDrag);
    window.addEventListener('blur', cancelDrag);

    return () => {
      window.removeEventListener('pointermove', handleWindowMove);
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('mouseup', finishDrag);
      window.removeEventListener('pointercancel', cancelDrag);
      window.removeEventListener('blur', cancelDrag);
    };
  }, [applyOutlineChange, dragState?.id]);

  const startDrag = (event: ReactPointerEvent<HTMLElement>, cardId: string) => {
    if (readOnly) return;
    if (editingCardId === cardId) return;
    if (event.button !== 0) return;

    const cardElement = event.currentTarget.closest<HTMLElement>('.work-outline-card');
    if (!cardElement) return;

    const cardRect = cardElement.getBoundingClientRect();
    const cardIndex = outlineCards.findIndex((item) => item.id === cardId);
    const nextState = {
      id: cardId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: event.clientX - cardRect.left,
      offsetY: event.clientY - cardRect.top,
      width: cardRect.width,
      height: cardRect.height,
      dropIndex: Math.max(cardIndex, 0),
    };
    function cleanup() {
      pendingDragRef.current = null;
      window.removeEventListener('pointermove', handlePendingMove);
      window.removeEventListener('pointerup', handlePendingEnd);
      window.removeEventListener('pointercancel', handlePendingEnd);
      window.removeEventListener('blur', handlePendingEnd);
    }

    function handlePendingMove(moveEvent: globalThis.PointerEvent) {
      const pendingState = pendingDragRef.current;

      if (!pendingState) return;
      if (moveEvent.buttons !== 1) return;

      const movedDistance = Math.hypot(moveEvent.clientX - pendingState.pointerX, moveEvent.clientY - pendingState.pointerY);

      if (movedDistance < 6) return;

      const activeState = {
        ...pendingState,
        pointerX: moveEvent.clientX,
        pointerY: moveEvent.clientY,
      };

      moveEvent.preventDefault();
      cleanup();
      setEditingCardId(null);
      dragStateRef.current = activeState;
      setDragState(activeState);
    }

    function handlePendingEnd() {
      cleanup();
    }

    pendingDragRef.current = nextState;
    window.addEventListener('pointermove', handlePendingMove, { passive: false });
    window.addEventListener('pointerup', handlePendingEnd);
    window.addEventListener('pointercancel', handlePendingEnd);
    window.addEventListener('blur', handlePendingEnd);
  };

  const updateOutlineCard = (cardId: string, patch: Partial<WorkOutlineCard>) => {
    if (readOnly) return;
    replaceOutlineCards(outlineCardsRef.current.map((item) => (item.id === cardId ? { ...item, ...patch } : item)));
  };

  const beginEditing = (cardId: string) => {
    if (readOnly) return;
    if (editingCardId && editingCardId !== cardId) finishEditing();
    editingSnapshotRef.current = outlineCardsRef.current;
    setEditingCardId(cardId);
  };

  const handleEditKeyDown = (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      finishEditing();
    }
  };

  const confirmDelete = () => {
    if (readOnly || !pendingDeleteCard) return;

    editingSnapshotRef.current = null;
    setEditingCardId((current) => (current === pendingDeleteCard.id ? null : current));
    applyOutlineChange(outlineCardsRef.current.filter((item) => item.id !== pendingDeleteCard.id));
    setPendingDeleteCard(null);
  };

  const visibleOutlineCards = dragState ? outlineCards.filter((item) => item.id !== dragState.id) : outlineCards;
  const projectedOutlineCards = dragState ? moveOutlineCardToIndex(outlineCards, dragState.id, dragState.dropIndex) : outlineCards;
  const draggedCard = dragState ? outlineCards.find((item) => item.id === dragState.id) : null;

  const getDisplayIndex = (cardId: string) => {
    const cardIndex = projectedOutlineCards.findIndex((item) => item.id === cardId);
    return cardIndex < 0 ? 0 : cardIndex;
  };

  const renderDropSlot = () => (
    <div
      className="work-outline-drop-slot"
      style={{ minHeight: dragState ? dragState.height : undefined }}
      aria-hidden="true"
    />
  );

  const renderOutlineCard = (
    item: WorkOutlineCard,
    index: number,
    options?: { isGhost?: boolean; style?: CSSProperties },
  ) => {
    const isEditing = editingCardId === item.id && !options?.isGhost;
    const displayContents = visibleOutlineContents(item.contents, hideDoeImageReferences);

    return (
      <article
        className={`work-outline-card${isEditing ? ' editing' : ''}${options?.isGhost ? ' work-outline-drag-ghost' : ''}`}
        data-outline-card-id={options?.isGhost ? undefined : item.id}
        draggable={false}
        key={options?.isGhost ? undefined : item.id}
        onDoubleClick={options?.isGhost || readOnly ? undefined : () => beginEditing(item.id)}
        style={options?.style}
      >
        <span className="work-outline-index">{index + 1}</span>
        {isEditing ? (
          <div
            className="work-outline-copy work-outline-edit-fields"
            onDoubleClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <input
              aria-label={t('outline.cardTitleAria')}
              className="work-outline-edit-title"
              value={item.title}
              autoFocus
              onChange={(event) => updateOutlineCard(item.id, {
                title: event.target.value,
                contents: [event.target.value, ...item.contents.slice(1)].map((value) => value.trim()).filter(Boolean),
              })}
              onKeyDown={handleEditKeyDown}
            />
            <AutoGrowTextarea
              aria-label={t('outline.cardContentAria')}
              className="work-outline-edit-content"
              value={item.content}
              onChange={(event) => updateOutlineCard(item.id, {
                content: event.target.value,
                contents: [
                  item.title,
                  ...event.target.value.split('\n'),
                  ...(hideDoeImageReferences
                    ? item.contents.filter(isDoeOutlineImageReference)
                    : []),
                ].map((value) => value.trim()).filter(Boolean),
              })}
              onKeyDown={handleEditKeyDown}
            />
          </div>
        ) : (
          <div className="work-outline-copy">
            <h2>{item.title}</h2>
            {displayContents.length > 1 ? (
              <ul className="work-outline-content-list">
                {displayContents.slice(displayContents[0] === item.title ? 1 : 0).map((content, contentIndex) => (
                  <li key={`${item.id}-${contentIndex}`}>{content}</li>
                ))}
              </ul>
            ) : (
              <p>{item.content}</p>
            )}
          </div>
        )}
        <div className="work-outline-card-actions">
          <button
            aria-label={t('outline.reorderAria', { number: index + 1 })}
            className="work-outline-drag-handle"
            disabled={isEditing || readOnly}
            type="button"
            onPointerDown={options?.isGhost ? undefined : (event) => startDrag(event, item.id)}
          >
            <GripVertical style={{ width: 16, height: 16 }} />
          </button>
          {!options?.isGhost && !readOnly ? (
            <button
              aria-label={t('outline.deleteAria', { number: index + 1 })}
              className="work-outline-delete-button"
              type="button"
              onClick={() => setPendingDeleteCard(item)}
            >
              <Trash2 style={{ width: 15, height: 15 }} />
            </button>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <section className={`work-outline-preview${streamingDraft ? ' is-streaming' : ''}`} aria-label={t('outline.previewAria')}>
      <aside
        className="work-outline-panel"
        aria-label={t(artifactKind === 'social-card' ? 'socialCard.outlineAria' : 'outline.deckAria')}
      >
        {outlineLoadError ? <p className="work-outline-load-error">{outlineLoadError}</p> : null}
        {!streamingDraft && outline?.generationMode === 'deterministic_fallback' ? (
          <div className="work-outline-fallback-notice" role="status">
            <CircleAlert aria-hidden="true" size={18} />
            <div>
              <strong>{t('outline.fallbackNoticeTitle')}</strong>
              <span>{t('outline.fallbackNoticeDescription')}</span>
            </div>
          </div>
        ) : null}
        {!outlineLoadError && outlineCards.length === 0 ? (
          <div className="work-outline-empty" role="status" aria-busy={isOutlineLoading || undefined}>
            <strong>{t('outline.emptyTitle')}</strong>
            <div className="work-outline-empty-visual">
              <img src={outlineEmptyImage} alt="" decoding="async" />
            </div>
          </div>
        ) : null}

        <div
          className={`work-outline-list${dragState ? ' is-dragging' : ''}`}
          ref={outlineListRef}
        >
          {visibleOutlineCards.map((item, visibleIndex) => {
            const displayIndex = getDisplayIndex(item.id);
            return (
              <Fragment key={item.id}>
                {dragState?.dropIndex === visibleIndex ? renderDropSlot() : null}
                {renderOutlineCard(item, displayIndex)}
              </Fragment>
            );
          })}
          {dragState && dragState.dropIndex === visibleOutlineCards.length ? renderDropSlot() : null}
        </div>

        {dragState && draggedCard
          ? renderOutlineCard(draggedCard, getDisplayIndex(draggedCard.id), {
              isGhost: true,
              style: {
                width: dragState.width,
                minHeight: dragState.height,
                transform: `translate3d(${dragState.pointerX - dragState.offsetX}px, ${dragState.pointerY - dragState.offsetY}px, 0)`,
              },
            })
          : null}
      </aside>

      {pendingDeleteCard ? (
        <div
          className="work-outline-delete-mask"
          role="presentation"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setPendingDeleteCard(null);
          }}
        >
          <div
            aria-describedby="outline-delete-description"
            aria-labelledby="outline-delete-title"
            aria-modal="true"
            className="work-outline-delete-dialog"
            role="alertdialog"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <span className="work-outline-delete-icon" aria-hidden="true">
              <AlertTriangle style={{ width: 20, height: 20 }} />
            </span>
            <div className="work-outline-delete-copy">
              <h2 id="outline-delete-title">{t('outline.deleteTitle')}</h2>
              <p id="outline-delete-description">
                {t(artifactKind === 'social-card'
                  ? 'socialCard.deleteDescription'
                  : 'outline.deleteDescription', {
                  number: outlineCards.findIndex((item) => item.id === pendingDeleteCard.id) + 1,
                })}
              </p>
            </div>
            <div className="work-outline-delete-actions">
              <button type="button" autoFocus onClick={() => setPendingDeleteCard(null)}>{t('outline.cancel')}</button>
              <button className="danger" type="button" onClick={confirmDelete}>
                <Trash2 style={{ width: 15, height: 15 }} />
                {t('outline.delete')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
});

