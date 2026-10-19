import { useCallback, useEffect, useRef, useState } from 'react';
import { actOnGeneration, readGeneration, type ProjectAction, type ProjectSnapshot } from '../../../lib/generation';
import { WebApiRequestError } from '../adapters/webApi';

export function useGeneration(projectId: string) {
  const [project, setProject] = useState<ProjectSnapshot | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const mounted = useRef(true);
  const pending = useRef(false);
  const receipt = useRef<{ fingerprint: string; action: ProjectAction } | null>(null);
  const accept = useCallback((next: ProjectSnapshot) => {
    if (mounted.current) setProject(current => {
      if (!current || next.revision > current.revision) return next;
      if (next.revision === current.revision && JSON.stringify(next.run) !== JSON.stringify(current.run)) return { ...current, run: next.run };
      return current;
    });
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const read = async () => {
      try {
        const next = await readGeneration(projectId, controller.signal);
        if (controller.signal.aborted) return;
        accept(next);
        // A mutation error remains visible until the user acts again.
        setError((current: unknown) => current instanceof TypeError ? null : current);
        if (next.status !== 'ready') timer = setTimeout(read, next.status === 'running' ? 1500 : 5000);
      } catch (reason) {
        if (controller.signal.aborted) return;
        setError(reason);
        timer = setTimeout(read, 5000);
      }
    };
    void read();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [projectId, refreshKey, accept]);

  const act = async (input: Omit<ProjectAction, 'requestId'>) => {
    if (pending.current) return false;
    pending.current = true; setBusy(true); setError(null);
    const { expectedRevision: _revision, ...intent } = input;
    const fingerprint = JSON.stringify(intent);
    if (receipt.current?.fingerprint !== fingerprint) receipt.current = { fingerprint, action: { ...input, requestId: crypto.randomUUID() } };
    try {
      const next = await actOnGeneration(projectId, receipt.current.action);
      accept(next); receipt.current = null;
      return true;
    } catch (reason) {
      if (mounted.current) setError(reason);
      if (reason instanceof WebApiRequestError && reason.status < 500) receipt.current = null;
      if (reason instanceof WebApiRequestError && reason.status === 409) setRefreshKey(value => value + 1);
      return false;
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const recover = receipt.current ? async () => {
    if (!receipt.current) return false;
    const { requestId: _requestId, ...original } = receipt.current.action;
    return act(original);
  } : null;
  return { project, error, busy, act, recover, accept, refresh: () => { setError(null); setRefreshKey(value => value + 1); } };
}
