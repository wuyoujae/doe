import { applyPlaybackEvent, type LiveRuntime, type PlaybackEvent } from '../live-state/index.ts';
import { AUTH_CHANGE_CHANNEL } from '@yrkie/application/features/presentation/services/authEvents.ts';

// One stream per role/link per browser, rather than one HTTP/1 connection per tab.
type Hub = { source: EventSource; ports: Set<MessagePort>; runtime?: LiveRuntime; connected: boolean };
const hubs = new Map<string, Hub>();
const clients = new Map<MessagePort, { url: string; seen: number }>();
if (typeof BroadcastChannel !== 'undefined') {
  const auth = new BroadcastChannel(AUTH_CHANGE_CHANNEL);
  auth.onmessage = () => {
    const ports = [...clients.keys()];
    for (const hub of hubs.values()) hub.source.close();
    hubs.clear(); clients.clear();
    for (const port of ports) port.postMessage({ type: 'event', value: { kind: 'reauthorize' } });
  };
}
function remove(port: MessagePort) {
  const client = clients.get(port); if (!client) return;
  const hub = hubs.get(client.url); hub?.ports.delete(port); clients.delete(port);
  if (hub && !hub.ports.size) { hub.source.close(); hubs.delete(client.url); }
}
function subscribe(port: MessagePort, url: string) {
  const target = new URL(url);
  if (target.origin !== self.location.origin || !/^\/api\/v1\/playback-links\/[0-9a-f]{64}\/events$/.test(target.pathname) || target.search) return;
  const old = clients.get(port);
  if (old?.url !== url) remove(port);
  let hub = hubs.get(url);
  if (!hub) {
    if (hubs.size >= 32) { port.postMessage({ type: 'disconnect' }); return; }
    const source = new EventSource(url, { withCredentials: true });
    const created: Hub = { source, ports: new Set(), connected: false }; hub = created; hubs.set(url, created);
    source.onmessage = message => {
      if (hubs.get(url) !== created) return;
      let value: PlaybackEvent;
      try { value = JSON.parse(message.data); } catch {
        created.connected = false;
        for (const client of created.ports) client.postMessage({ type: 'disconnect' });
        return;
      }
      created.connected = true;
      if (value.kind === 'sync' && value.runtime) created.runtime = value.runtime;
      else if (created.runtime) created.runtime = applyPlaybackEvent(created.runtime, value) || undefined;
      for (const client of created.ports) client.postMessage({ type: 'event', value });
      if (['denied', 'end', 'restart'].includes(value.kind)) {
        source.close(); hubs.delete(url);
        for (const client of created.ports) clients.delete(client);
      }
    };
    source.onerror = () => { created.connected = false; for (const client of created.ports) client.postMessage({ type: 'disconnect' }); };
  }
  hub.ports.add(port); clients.set(port, { url, seen: Date.now() });
  // A joining document already fetched its own authorized deck and capabilities.
  if (hub.runtime && hub.connected) port.postMessage({ type: 'event', value: { kind: 'sync', runtime: hub.runtime, epoch: hub.runtime.epoch } });
}
self.addEventListener('connect', ((event: MessageEvent) => {
  const port = event.ports[0];
  port.onmessage = event => {
    if (event.data?.type === 'subscribe' && typeof event.data.url === 'string') subscribe(port, event.data.url);
    else if (event.data?.type === 'unsubscribe') remove(port);
    else if (event.data?.type === 'pong') { const client = clients.get(port); if (client) client.seen = Date.now(); }
  };
  port.onmessageerror = () => remove(port); port.start();
}) as EventListener);
setInterval(() => {
  for (const [port, client] of clients) {
    if (Date.now() - client.seen > 30000) remove(port);
    else port.postMessage({ type: 'ping' });
  }
}, 5000);
