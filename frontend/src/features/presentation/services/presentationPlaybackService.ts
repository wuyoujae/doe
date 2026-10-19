import { getWebApiAssetUrl, requestWebApi } from './api';
import type { Show } from '@yrkie/doe/packages/doe-document/src/document/presentation/live/presentation-model/index.ts';
import { AUTH_CHANGE_CHANNEL } from './authEvents';

export type PlaybackScope = 'owner' | 'public';
export type PlaybackAccess = { access: PlaybackScope; operate: PlaybackScope };
export type PlaybackSettings = { revision: number; presenterLink: string; audienceLink: string; presenter: PlaybackAccess; audience: PlaybackAccess };
export type { InkStroke, LiveRuntime, PlaybackCapabilities, PlaybackSnapshot, PlaybackEvent } from '@yrkie/doe/packages/doe-document/src/document/presentation/live/live-state/index.ts';
import type { LiveRuntime, PlaybackSnapshot, PlaybackEvent } from '@yrkie/doe/packages/doe-document/src/document/presentation/live/live-state/index.ts';
export { applyPlaybackEvent } from '@yrkie/doe/packages/doe-document/src/document/presentation/live/live-state/index.ts';
const endpoint = (link: string) => `/api/v1/playback-links/${encodeURIComponent(link)}`;
const ownerEndpoint = (session: string) => `/api/v1/projects/${encodeURIComponent(session)}/playback`;
export type SpeakerNote = { slideId: string; content: string; revision: number; canEdit: boolean; sourceChanged: boolean };
export const readSpeakerNote = (link: string, slide: string, signal?: AbortSignal) => requestWebApi<SpeakerNote>(`${endpoint(link)}/notes/${encodeURIComponent(slide)}`, { signal, skipAuthRedirect: true, cache: 'no-store' });
export const saveSpeakerNote = (link: string, slide: string, content: string, expectedRevision: number, epoch: string) => requestWebApi<SpeakerNote>(`${endpoint(link)}/notes/${encodeURIComponent(slide)}`, { method: 'PUT', skipAuthRedirect: true, body: { content, expectedRevision, epoch } });
export const playbackSettings = (session: string) => requestWebApi<PlaybackSettings>(ownerEndpoint(session), { cache: 'no-store' });
export const savePlaybackAccess = (session: string, value: PlaybackSettings) => requestWebApi<PlaybackSettings>(`${ownerEndpoint(session)}/access`, {
  method: 'PUT', body: { expectedRevision: value.revision, presenter: value.presenter, audience: value.audience },
});
export const startPlayback = (session: string, sourceRevision: number) => requestWebApi<PlaybackSettings>(`${ownerEndpoint(session)}/start`, { method: 'POST', body: { sourceRevision } });
export function playbackId() { return [...crypto.getRandomValues(new Uint8Array(32))].map(v => v.toString(16).padStart(2, '0')).join(''); }
export async function readPlayback(link: string, signal?: AbortSignal) {
  const sentAt = Date.now();
  const snapshot = await requestWebApi<PlaybackSnapshot>(endpoint(link), { signal, skipAuthRedirect: true, cache: 'no-store' });
  snapshot.clockOffset = Number.isFinite(snapshot.serverTime) ? snapshot.serverTime - (sentAt + Date.now()) / 2 : 0;
  const rewrite = (v: unknown): unknown => {
    if (typeof v === 'string' && /^yrkie-asset-data:\/\/[0-9a-f]{64}$/.test(v)) return getWebApiAssetUrl(`${endpoint(link)}/assets/${v.slice('yrkie-asset-data://'.length)}`);
    if (Array.isArray(v)) return v.map(rewrite);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, value]) => [k, rewrite(value)]));
    return v;
  };
  snapshot.show = rewrite(snapshot.show) as Show;
  return snapshot;
}
export function subscribePlayback(link: string, onEvent: (event: PlaybackEvent) => void, onDisconnect: () => void) {
  const url = getWebApiAssetUrl(`${endpoint(link)}/events`);
  if (typeof SharedWorker !== 'undefined' && new URL(url, location.origin).origin === location.origin) {
    try {
      const worker = new SharedWorker(new URL('../../../../../packages/doe/packages/doe-document/src/document/presentation/live/playback-stream.worker/index.ts', import.meta.url), { type: 'module', name: 'yrkie-playback-stream-v1' });
      const port = worker.port; let closed = false; let fallback: (() => void) | undefined;
      const subscribe = () => { if (!closed) port.postMessage({ type: 'subscribe', url: new URL(url, location.origin).href }); };
      port.onmessage = event => {
        if (closed) return;
        if (event.data.type === 'ping') port.postMessage({ type: 'pong' });
        else if (event.data.type === 'event') onEvent(event.data.value);
        else if (event.data.type === 'disconnect') onDisconnect();
      };
      worker.onerror = () => { if (!closed && !fallback) { port.close(); fallback = directStream(url, onEvent, onDisconnect); } };
      const visible = () => { if (!document.hidden && !fallback) subscribe(); };
      const leave = () => port.postMessage({ type: 'unsubscribe' });
      port.start(); subscribe(); document.addEventListener('visibilitychange', visible); window.addEventListener('pagehide', leave); window.addEventListener('pageshow', visible);
      return () => { closed = true; leave(); port.close(); fallback?.(); document.removeEventListener('visibilitychange', visible); window.removeEventListener('pagehide', leave); window.removeEventListener('pageshow', visible); };
    } catch { /* Older browsers retain ordinary SSE over the production HTTP/2 connection. */ }
  }
  return directStream(url, onEvent, onDisconnect);
}
function directStream(url: string, onEvent: (event: PlaybackEvent) => void, onDisconnect: () => void) {
  const source = new EventSource(url, { withCredentials: true });
  const auth = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(AUTH_CHANGE_CHANNEL) : null;
  if (auth) auth.onmessage = () => { source.close(); onEvent({ kind: 'reauthorize' }); };
  source.onmessage = event => { try { onEvent(JSON.parse(event.data)); } catch { onDisconnect(); source.close(); } };
  source.onerror = onDisconnect;
  return () => { source.close(); auth?.close(); };
}
export function sendPlaybackCommand(link: string, clientId: string, state: LiveRuntime, action: string, extra: Record<string, unknown> = {}) {
  return requestWebApi<{ ok: boolean }>(`${endpoint(link)}/commands`, { method: 'POST', skipAuthRedirect: true,
    body: { ...extra, action, clientId, commandId: playbackId(), epoch: state.epoch, revision: state.revision, index: state.index, generation: state.generations[String(state.index)] || 0 } });
}
