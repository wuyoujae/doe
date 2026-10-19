import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  cancelUpload, createClientUploadId, createPromptAttachmentItem, deleteUpload,
  getPromptAttachmentPreflightError, loadUploadDraft, promptAttachmentFromUpload,
  retryUpload, uploadFile,
} from '../../lib/attachments';
import { WebApiRequestError } from '../../pages/work/adapters/webApi';
import { MAX_PROMPT_ATTACHMENTS, MAX_PROMPT_ATTACHMENT_BYTES, type PromptAttachmentItem } from '../../types/uploadAttachment';

const STORAGE_PREFIX = 'yrkie.prompt-attachment-draft.v1:';
const ORDER_PREFIX = 'yrkie.prompt-attachment-order.v1:';
const HIDDEN_PREFIX = 'yrkie.prompt-attachment-hidden.v1:';
const REFRESH_MS = 1_500;

/** Draft identity is independent of the project so Create uploads survive navigation. */
export function getOrCreatePromptAttachmentDraftId(scope: string) {
  try {
    const existing = sessionStorage.getItem(`${STORAGE_PREFIX}${encodeURIComponent(scope)}`);
    if (existing) return existing;
  } catch { /* The mounted composer retains its in-memory identity. */ }
  const draftId = createClientUploadId();
  try { sessionStorage.setItem(`${STORAGE_PREFIX}${encodeURIComponent(scope)}`, draftId); } catch { /* Storage is optional. */ }
  return draftId;
}

export function usePromptAttachments({ draftId, enabled = true }: { draftId: string; enabled?: boolean }) {
  const [items, setItems] = useState<PromptAttachmentItem[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<ReadonlySet<string>>(new Set());
  const itemsRef = useRef<PromptAttachmentItem[]>([]);
  const identity = useRef(draftId);
  const epoch = useRef(0);
  const controllers = useRef(new Map<string, AbortController>());
  const hidden = useRef(new Set<string>());
  const order = useRef<string[]>([]);
  const refreshing = useRef<Promise<void> | null>(null);
  identity.current = draftId;

  const updateItems = useCallback((update: (current: PromptAttachmentItem[]) => PromptAttachmentItem[]) => {
    const next = update(itemsRef.current);
    itemsRef.current = next;
    order.current = [...new Set([...order.current, ...next.map(item => item.clientUploadId)])]
      .filter(id => next.some(item => item.clientUploadId === id));
    writeIds(ORDER_PREFIX, identity.current, order.current);
    setItems(next);
  }, []);

  const applyItem = useCallback((item: PromptAttachmentItem) => {
    if (identity.current !== item.draftId || hidden.current.has(item.clientUploadId)) return;
    updateItems(current => current.map(existing => existing.clientUploadId === item.clientUploadId
      ? { ...item, file: item.file ?? existing.file } : existing));
  }, [updateItems]);

  const refreshDraft = useCallback(async (signal?: AbortSignal) => {
    if (!enabled || !draftId || signal?.aborted) return;
    if (refreshing.current) return refreshing.current;
    const requestedEpoch = epoch.current;
    const isCurrent = () => identity.current === draftId && epoch.current === requestedEpoch && !signal?.aborted;
    const request = (async () => {
      try {
        const attachments = await loadUploadDraft(draftId, signal);
        if (!isCurrent()) return;
        const server = attachments.filter(item => item.status !== 'deleted' && item.status !== 'expired');
        // A cancelled multipart request can finish server-side after the browser aborts.
        // Keep its tombstone across refresh and remove the late draft instead of reviving it.
        for (const attachment of server.filter(item => hidden.current.has(item.clientUploadId))) {
          void deleteUpload(attachment.uploadId, signal).catch(() => undefined);
        }
        updateItems(current => {
          const byId = new Map(server.filter(item => !hidden.current.has(item.clientUploadId))
            .map(item => [item.clientUploadId, promptAttachmentFromUpload(item)]));
          current.forEach(item => {
            const remote = byId.get(item.clientUploadId);
            if (remote) byId.set(item.clientUploadId, { ...remote, file: item.file });
            else if (!item.uploadId && !hidden.current.has(item.clientUploadId)) byId.set(item.clientUploadId, item);
          });
          const positions = new Map(order.current.map((id, index) => [id, index]));
          return [...byId.values()].sort((a, b) => (positions.get(a.clientUploadId) ?? Infinity) - (positions.get(b.clientUploadId) ?? Infinity));
        });
        setRestoreFailed(false);
      } catch {
        if (isCurrent()) setRestoreFailed(true);
      }
    })();
    refreshing.current = request;
    try { await request; } finally { if (refreshing.current === request) refreshing.current = null; }
  }, [draftId, enabled, updateItems]);

  useEffect(() => {
    const controller = new AbortController();
    epoch.current += 1;
    refreshing.current = null;
    hidden.current = new Set(readIds(HIDDEN_PREFIX, draftId));
    order.current = readIds(ORDER_PREFIX, draftId);
    itemsRef.current = [];
    setItems([]);
    setRemovingIds(new Set());
    setSelectionError(null);
    setRestoreFailed(false);
    setIsRestoring(enabled && Boolean(draftId));
    if (enabled && draftId) void refreshDraft(controller.signal).finally(() => {
      if (!controller.signal.aborted) setIsRestoring(false);
    });
    return () => {
      controller.abort();
      controllers.current.forEach(pending => pending.abort());
      controllers.current.clear();
      epoch.current += 1;
    };
  }, [draftId, enabled, refreshDraft]);

  const hasProcessing = items.some(item => item.status === 'processing' && Boolean(item.uploadId));
  useEffect(() => {
    if (!hasProcessing || !enabled) return;
    const controller = new AbortController();
    const timer = window.setInterval(() => void refreshDraft(controller.signal), REFRESH_MS);
    return () => { window.clearInterval(timer); controller.abort(); };
  }, [enabled, hasProcessing, refreshDraft]);

  const addFiles = useCallback(async (selected: File[] | FileList) => {
    if (!enabled || isRestoring || !draftId) return [];
    const requestedEpoch = epoch.current;
    const files = Array.from(selected);
    const available = Math.max(0, MAX_PROMPT_ATTACHMENTS - itemsRef.current.length);
    setSelectionError(files.length > available ? 'too_many_files' : null);
    let bytes = itemsRef.current.filter(item => item.status !== 'failed').reduce((sum, item) => sum + item.sizeBytes, 0);
    const initial = files.slice(0, available).map(file => {
      const item = createPromptAttachmentItem(file, draftId);
      const errorCode = getPromptAttachmentPreflightError(file)
        ?? (bytes + file.size > MAX_PROMPT_ATTACHMENT_BYTES ? 'attachments_total_too_large' : null);
      if (errorCode) return { ...item, status: 'failed' as const, errorCode };
      bytes += file.size;
      controllers.current.set(item.clientUploadId, new AbortController());
      return item;
    });
    updateItems(current => [...current, ...initial]);
    const uploadable = initial.filter(item => item.status === 'uploading');
    const ids = uploadable.map(item => item.clientUploadId);
    try {
      return await uploadFile(uploadable.map(item => item.file!), {
        draftId, clientUploadIds: ids,
        itemSignals: new Map(ids.map(id => [id, controllers.current.get(id)!.signal])),
        onItemChange: item => { if (epoch.current === requestedEpoch) applyItem(item); },
      });
    } finally {
      if (epoch.current === requestedEpoch) ids.forEach(id => controllers.current.delete(id));
    }
  }, [applyItem, draftId, enabled, isRestoring, updateItems]);

  const retryItem = useCallback(async (clientUploadId: string) => {
    const item = itemsRef.current.find(candidate => candidate.clientUploadId === clientUploadId);
    if (!item || !enabled || isRestoring || controllers.current.has(clientUploadId)
      || (item.uploadId ? !item.retryable : !item.file || Boolean(getPromptAttachmentPreflightError(item.file)))) return;
    const requestedEpoch = epoch.current;
    const controller = new AbortController();
    controllers.current.set(clientUploadId, controller);
    applyItem({ ...item, status: item.uploadId ? 'processing' : 'uploading', errorCode: null, errorMessage: null });
    try {
      if (item.uploadId) {
        const remote = await retryUpload(item.uploadId, controller.signal);
        if (epoch.current === requestedEpoch) applyItem(promptAttachmentFromUpload(remote, item.file));
      } else {
        await uploadFile([item.file!], { draftId, clientUploadIds: [clientUploadId],
          itemSignals: new Map([[clientUploadId, controller.signal]]),
          onItemChange: next => { if (epoch.current === requestedEpoch) applyItem(next); } });
      }
    } catch (error) {
      if (epoch.current === requestedEpoch && !controller.signal.aborted) applyItem({ ...item, status: 'failed',
        errorCode: error instanceof WebApiRequestError ? error.code : 'upload_failed' });
    } finally { if (controllers.current.get(clientUploadId) === controller) controllers.current.delete(clientUploadId); }
  }, [applyItem, draftId, enabled, isRestoring]);

  const removeItem = useCallback(async (clientUploadId: string) => {
    const item = itemsRef.current.find(candidate => candidate.clientUploadId === clientUploadId);
    if (!item || removingIds.has(clientUploadId)) return;
    const requestedEpoch = epoch.current;
    controllers.current.get(clientUploadId)?.abort();
    controllers.current.delete(clientUploadId);
    setSelectionError(null);
    setRemovingIds(current => new Set(current).add(clientUploadId));
    try {
      if (item.uploadId) await deleteUpload(item.uploadId);
      else await cancelUpload(draftId, clientUploadId);
      if (epoch.current !== requestedEpoch) return;
      hidden.current.add(clientUploadId);
      writeIds(HIDDEN_PREFIX, draftId, [...hidden.current]);
      updateItems(current => current.filter(candidate => candidate.clientUploadId !== clientUploadId));
    } catch {
      if (epoch.current === requestedEpoch) applyItem({ ...item, status: 'failed', errorCode: 'delete_failed' });
    } finally {
      if (epoch.current === requestedEpoch) setRemovingIds(current => new Set([...current].filter(id => id !== clientUploadId)));
    }
  }, [applyItem, draftId, removingIds, updateItems]);

  const clearItems = useCallback((clientUploadIds: string[]) => {
    const consumed = new Set(clientUploadIds);
    clientUploadIds.forEach(id => hidden.current.add(id));
    writeIds(HIDDEN_PREFIX, draftId, [...hidden.current]);
    updateItems(current => current.filter(item => !consumed.has(item.clientUploadId)));
    setSelectionError(null);
  }, [draftId, updateItems]);

  const readyItems = useMemo(() => items.filter(item => item.status === 'ready' && item.uploadId), [items]);
  return { items, readyItems, readyUploadIds: readyItems.map(item => item.uploadId!),
    hasBlockingItems: isRestoring || restoreFailed || items.some(item => item.status !== 'ready') || removingIds.size > 0,
    isRestoring, restoreFailed, selectionError, removingIds,
    canAddMore: enabled && !isRestoring && items.length < MAX_PROMPT_ATTACHMENTS,
    addFiles, retryItem, removeItem, clearItems, refreshDraft };
}

function readIds(prefix: string, draftId: string): string[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(`${prefix}${draftId}`) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

function writeIds(prefix: string, draftId: string, ids: string[]) {
  try { sessionStorage.setItem(`${prefix}${draftId}`, JSON.stringify(ids)); } catch { /* The active composer remains consistent. */ }
}
