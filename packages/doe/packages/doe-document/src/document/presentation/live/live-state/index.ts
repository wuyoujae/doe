import type { Position, Show } from '../presentation-model/index.ts';

export type InkStroke = { id: string; index: number; generation: number; clientId: string; tool: 'pen' | 'highlighter'; color: string; width: number; points: [number, number][] };
export type LiveRuntime = Position & { epoch: string; seq: number; startedAt: number; ink: Record<string, InkStroke>; generations: Record<string, number> };
export type PlaybackCapabilities = { role: 'presenter' | 'audience'; canOperate: boolean; isOwner: boolean; accessRevision: number };
export type PlaybackSnapshot = { capabilities: PlaybackCapabilities; runtime: LiveRuntime; show: Show; notes?: string[]; sourceRevision: number; serverTime: number; clockOffset: number };
export type PlaybackEvent = { kind: string; epoch?: string; seq?: number; at?: number; capabilities?: PlaybackCapabilities; runtime?: LiveRuntime; position?: Position; stroke?: InkStroke; strokeId?: string; index?: number; generation?: number; clientId?: string; point?: [number, number] | null; code?: string };
/** A gap must resynchronize before consuming another delta. Pointer movement has no durable sequence. */
export function applyPlaybackEvent(current: LiveRuntime, event: PlaybackEvent): LiveRuntime | null {
  if (event.epoch && event.epoch !== current.epoch) return null;
  if (event.kind === 'sync' && event.runtime) {
    if (event.runtime.epoch !== current.epoch) return null;
    return event.runtime.seq < current.seq ? current : event.runtime;
  }
  if (event.seq === undefined || event.seq <= current.seq) return current;
  if (event.seq !== current.seq + 1) return null;
  const next = { ...current, ...event.position, seq: event.seq, ink: { ...current.ink }, generations: { ...current.generations } };
  if (event.kind === 'ink' && event.stroke) next.ink[event.stroke.id] = event.stroke;
  if (event.kind === 'erase' && event.strokeId) delete next.ink[event.strokeId];
  if (event.kind === 'clear' && event.index !== undefined) {
    next.ink = Object.fromEntries(Object.entries(next.ink).filter(([, s]) => s.index !== event.index));
    next.generations[String(event.index)] = event.generation || 0;
  }
  return next;
}
