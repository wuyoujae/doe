import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Eraser, Expand, Highlighter, MousePointer2, PenLine, Scan, Circle, Trash2, X } from 'lucide-react';
import { PresentationSurface } from '@yrkie/doe/packages/doe-document/src/document/presentation/live/presentation-surface/index.ts';
import { SpeakerNotesEditor } from '@yrkie/doe/packages/doe-document/src/document/presentation/live/SpeakerNotesEditor/index.tsx';
import { applyPlaybackEvent, playbackId, readPlayback, sendPlaybackCommand, subscribePlayback, type InkStroke, type PlaybackSnapshot } from './services/presentationPlaybackService';
import { WebApiRequestError } from '../../pages/work/adapters/webApi';
import '@yrkie/doe/packages/doe-document/src/document/presentation/live/live-presentation/index.css';

type Tool = 'browse' | 'pen' | 'highlighter' | 'eraser' | 'laser';
const tools = { browse: MousePointer2, pen: PenLine, highlighter: Highlighter, eraser: Eraser, laser: Circle };
const colors = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#ffffff'];
export function LivePresentationPage({ link, role }: { link: string; role: 'presenter' | 'audience' }) {
  const { t } = useTranslation('presentation');
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot | null>(null); const current = useRef(snapshot); current.current = snapshot;
  const [connected, setConnected] = useState(false); const connection = useRef(false); connection.current = connected;
  const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [reload, setReload] = useState(0);
  const [tool, setTool] = useState<Tool>('browse'); const [color, setColor] = useState(colors[0]); const [width, setWidth] = useState(3);
  const [draft, setDraft] = useState<InkStroke | null>(null); const draftRef = useRef(draft); draftRef.current = draft;
  const [lasers, setLasers] = useState<Record<string, { point: [number, number]; expires: number }>>({});
  const [clock, setClock] = useState(Date.now()); const [controls, setControls] = useState(true);
  const clientId = useRef(playbackId()); const stage = useRef<HTMLDivElement>(null); const next = useRef<HTMLDivElement>(null);
  const surface = useRef<PresentationSurface>(); const preview = useRef<PresentationSurface>();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(); const requestQueue = useRef(new Map<string, { stroke: InkStroke; snapshot: PlaybackSnapshot }>());
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null); const laserPoint = useRef<[number, number] | null>(null);
  const sending = useRef(false); const lastSent = useRef(0); const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex,noarchive'; document.head.append(robots);
    const referrer = document.createElement('meta'); referrer.name = 'referrer'; referrer.content = 'no-referrer'; document.head.append(referrer);
    const timer = setInterval(() => { setClock(Date.now()); setLasers(v => Object.fromEntries(Object.entries(v).filter(([, p]) => p.expires > Date.now()))); }, 500);
    return () => { mounted.current = false; robots.remove(); referrer.remove(); clearInterval(timer); clearTimeout(hideTimer.current); };
  }, []);
  useEffect(() => {
    const abort = new AbortController(); let stopped = false; let close: (() => void) | undefined; let health: ReturnType<typeof setInterval> | undefined; let lastEvent = Date.now();
    setConnected(false); setError(''); setDraft(null); requestQueue.current.clear();
    const fail = (code: string) => { if (stopped) return; setConnected(false); setSnapshot(null); setError(code); close?.(); };
    void readPlayback(link, abort.signal).then(initial => {
      if (stopped) return;
      if (initial.capabilities.role !== role) { fail('playback_forbidden'); return; }
      const previous = current.current;
      if (previous?.runtime.epoch === initial.runtime.epoch && previous.sourceRevision === initial.sourceRevision) initial.show = previous.show;
      current.current = initial; setSnapshot(initial);
      close = subscribePlayback(link, event => {
        if (stopped) return; lastEvent = Date.now();
        if (event.kind === 'denied' || event.kind === 'end') { fail(event.code || 'playback_ended'); return; }
        if (event.kind === 'restart' || event.kind === 'reauthorize') { close?.(); setReload(v => v + 1); return; }
        const before = current.current; if (!before) return;
        const runtime = applyPlaybackEvent(before.runtime, event);
        if (!runtime) { close?.(); setReload(v => v + 1); return; }
        const value = { ...before, runtime, capabilities: event.capabilities || before.capabilities };
        current.current = value; setSnapshot(value); setConnected(true);
        if (event.kind === 'clear' && event.index === runtime.index) { setDraft(null); draftRef.current = null; pointer.current = null; requestQueue.current.clear(); }
        if (event.kind === 'erase' && event.strokeId) {
          requestQueue.current.delete(event.strokeId);
          if (draftRef.current?.id === event.strokeId) { draftRef.current = null; pointer.current = null; }
          setDraft(v => v?.id === event.strokeId ? null : v);
        }
        if (event.kind === 'ink' && event.stroke && !pointer.current) setDraft(v => v?.id === event.stroke!.id && v.points.length <= event.stroke!.points.length ? null : v);
        if (event.kind === 'laser' && event.index === runtime.index && event.clientId && event.clientId !== clientId.current && !runtime.black) {
          const id = event.clientId;
          setLasers(v => { const result = { ...v }; if (event.point) result[id] = { point: event.point, expires: Date.now() + 1200 }; else delete result[id]; return result; });
        }
      }, () => { setConnected(false); setDraft(null); requestQueue.current.clear(); setLasers({}); });
      health = setInterval(() => { if (Date.now() - lastEvent > 7000) { setConnected(false); setDraft(null); requestQueue.current.clear(); } }, 1000);
    }, e => { if (!stopped) fail(e instanceof WebApiRequestError ? e.code || 'failed' : 'failed'); });
    return () => { stopped = true; abort.abort(); close?.(); clearInterval(health); };
  }, [link, role, reload]);
  useEffect(() => {
    if (!snapshot?.show || !stage.current) return;
    surface.current = new PresentationSurface(stage.current, snapshot.show, () => setNotice(t('renderFailed')), { now: () => Date.now() + snapshot.clockOffset, title: t('canvas') });
    if (next.current) preview.current = new PresentationSurface(next.current, snapshot.show, () => {}, { now: () => Date.now() + snapshot.clockOffset, mode: 'static', title: t('nextSlide') });
    return () => { surface.current?.dispose(); preview.current?.dispose(); surface.current = undefined; preview.current = undefined; };
  }, [snapshot?.show, t]);
  useEffect(() => {
    if (!snapshot) return;
    void surface.current?.render(snapshot.runtime);
    const index = Math.min(snapshot.runtime.index + 1, snapshot.show.slides.length - 1);
    void preview.current?.render({ ...snapshot.runtime, index, at: 0 }, true);
  }, [snapshot?.runtime.index, snapshot?.runtime.step, snapshot?.runtime.at, snapshot?.show]);
  const canOperate = connected && !!snapshot?.capabilities.canOperate;
  useEffect(() => { setDraft(null); draftRef.current = null; pointer.current = null; laserPoint.current = null; requestQueue.current.clear(); setLasers({}); }, [snapshot?.runtime.index, snapshot?.runtime.epoch, snapshot?.runtime.black, canOperate, tool]);
  const operate = useCallback(async (action: string, extra = {}) => {
    const value = current.current; if (!value || !connection.current || !value.capabilities.canOperate) return;
    try { await sendPlaybackCommand(link, clientId.current, value.runtime, action, extra); }
    catch (e) {
      if (!mounted.current) return;
      setNotice(t(e instanceof WebApiRequestError && e.code === 'playback_capacity' ? 'capacity' : e instanceof WebApiRequestError && e.status === 409 ? 'conflict' : 'operationFailed'));
      setConnected(false); setReload(v => v + 1);
    }
  }, [link, t]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('button,input,select,textarea,a,[contenteditable="true"]')) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if (event.key === 'Escape') { setTool('browse'); setDraft(null); requestQueue.current.clear(); return; }
      if (!canOperate) return;
      const key = event.key.toLowerCase();
      if (['arrowright', 'arrowdown', 'pagedown', ' '].includes(key)) { event.preventDefault(); void operate('next'); }
      else if (['arrowleft', 'arrowup', 'pageup'].includes(key)) { event.preventDefault(); void operate('previous'); }
      else if (key === 'b') { event.preventDefault(); void operate('black'); }
      else if (key === 'p') setTool('pen'); else if (key === 'l') setTool('laser'); else if (key === 'e') setTool('eraser');
    };
    window.addEventListener('keydown', keyboard); return () => window.removeEventListener('keydown', keyboard);
  }, [canOperate, operate]);
  const flushInk = async () => {
    if (sending.current || !requestQueue.current.size) return;
    const [id, item] = requestQueue.current.entries().next().value!; requestQueue.current.delete(id); sending.current = true;
    try {
      if (connection.current) await sendPlaybackCommand(link, clientId.current, item.snapshot.runtime, 'ink', { stroke: item.stroke });
    } catch (e) {
      requestQueue.current.clear();
      if (mounted.current) { setDraft(null); setNotice(t(e instanceof WebApiRequestError && e.code === 'playback_capacity' ? 'capacity' : 'operationFailed')); setReload(v => v + 1); }
    } finally { sending.current = false; if (requestQueue.current.size && mounted.current) void flushInk(); }
  };
  const point = (event: React.PointerEvent<SVGSVGElement>): [number, number] | null => {
    const box = event.currentTarget.getBoundingClientRect(); const scale = Math.min(box.width / 1280, box.height / 720);
    const x = (event.clientX - box.left - (box.width - scale * 1280) / 2) / (scale * 1280);
    const y = (event.clientY - box.top - (box.height - scale * 720) / 2) / (scale * 720);
    // Bounded coordinate precision keeps full strokes inside the command byte limit.
    return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? [Math.round(x * 100000) / 100000, Math.round(y * 100000) / 100000] : null;
  };
  const erase = (p: [number, number]) => {
    const strokes = Object.values(current.current?.runtime.ink || {}).reverse();
    const hit = strokes.find(s => s.index === current.current?.runtime.index && s.points.some((q, i) => {
      const previous = s.points[Math.max(0, i - 1)];
      const dx = (q[0] - previous[0]) * 1280, dy = (q[1] - previous[1]) * 720;
      const x = (p[0] - previous[0]) * 1280, y = (p[1] - previous[1]) * 720;
      const projection = Math.max(0, Math.min(1, (x * dx + y * dy) / (dx * dx + dy * dy || 1)));
      return Math.hypot(x - projection * dx, y - projection * dy) < 20;
    }));
    if (hit) void operate('erase', { strokeId: hit.id });
  };
  const queueStroke = (stroke: InkStroke) => {
    if (!current.current) return;
    if (requestQueue.current.size >= 8 && !requestQueue.current.has(stroke.id)) {
      requestQueue.current.clear(); setDraft(null); setConnected(false); setReload(v => v + 1); return;
    }
    requestQueue.current.set(stroke.id, { stroke: structuredClone(stroke), snapshot: current.current }); void flushInk();
  };
  const pointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!canOperate || event.button !== 0 || !snapshot || pointer.current) return;
    const p = point(event); if (!p) return;
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (tool === 'browse') return;
    event.preventDefault(); if (snapshot.runtime.black) return;
    if (tool === 'laser') { laserPoint.current = p; setLasers(v => ({ ...v, [clientId.current]: { point: p, expires: Date.now() + 1200 } })); void operate('laser', { point: p }); return; }
    if (tool === 'eraser') { erase(p); return; }
    const stroke: InkStroke = { id: playbackId(), clientId: clientId.current, index: snapshot.runtime.index, generation: snapshot.runtime.generations[String(snapshot.runtime.index)] || 0, tool, color, width, points: [p] };
    draftRef.current = stroke; setDraft(stroke); lastSent.current = Date.now(); queueStroke(stroke);
  };
  const pointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!canOperate || !event.buttons || pointer.current?.id !== event.pointerId || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const p = point(event); if (!p) return;
    if (tool === 'laser') { laserPoint.current = p; setLasers(v => ({ ...v, [clientId.current]: { point: p, expires: Date.now() + 1200 } })); if (Date.now() - lastSent.current > 80) { lastSent.current = Date.now(); void operate('laser', { point: p }); } return; }
    if (tool === 'eraser') { if (Date.now() - lastSent.current > 100) { lastSent.current = Date.now(); erase(p); } return; }
    const stroke = draftRef.current; if (!stroke) return;
    const updated = { ...stroke, points: [...stroke.points, p].slice(-512) };
    if (stroke.points.length >= 512) { queueStroke(stroke); updated.id = playbackId(); updated.points = [stroke.points.at(-1)!, p]; }
    draftRef.current = updated; setDraft(updated);
    if (Date.now() - lastSent.current > 40) { lastSent.current = Date.now(); queueStroke(updated); }
  };
  const pointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || pointer.current?.id !== event.pointerId) return;
    const start = pointer.current; pointer.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (tool === 'browse' && canOperate) {
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (Math.hypot(dx, dy) < 8) void operate('next');
      else if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) void operate(dx < 0 ? 'next' : 'previous');
    }
    if (tool === 'laser') { laserPoint.current = null; setLasers(v => { const result = { ...v }; delete result[clientId.current]; return result; }); void operate('laser', { point: null }); }
    if (draftRef.current) queueStroke(draftRef.current);
    draftRef.current = null;
  };
  useEffect(() => {
    const pulse = setInterval(() => {
      if (laserPoint.current && canOperate && tool === 'laser') {
        const point = laserPoint.current;
        setLasers(v => ({ ...v, [clientId.current]: { point, expires: Date.now() + 1200 } }));
        void operate('laser', { point });
      }
    }, 500);
    return () => clearInterval(pulse);
  }, [canOperate, tool, operate]);
  const renderedInk = useMemo(() => {
    if (!snapshot || snapshot.runtime.black) return null;
    const strokes = { ...snapshot.runtime.ink, ...(draft ? { [draft.id]: draft } : {}) };
    return Object.values(strokes).filter(s => s.index === snapshot.runtime.index).map(s => <polyline key={s.id} points={s.points.map(p => `${p[0] * 1280},${p[1] * 720}`).join(' ')} fill="none" stroke={s.color} strokeWidth={s.tool === 'highlighter' ? s.width * 4 : s.width} opacity={s.tool === 'highlighter' ? 0.35 : 1} strokeLinecap="round" strokeLinejoin="round" />);
  }, [snapshot?.runtime.ink, snapshot?.runtime.index, snapshot?.runtime.black, draft]);
  const wake = () => { setControls(true); clearTimeout(hideTimer.current); hideTimer.current = setTimeout(() => setControls(false), 2800); };
  const fullscreen = () => { void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => setNotice(t('fullscreenFailed'))); };
  if (!snapshot) return <main className="live-empty"><PresentationStatus text={t(error ? `errors.${error}` : 'loading', { defaultValue: t('failed') })} />{error && <div><button onClick={() => setReload(v => v + 1)}>{t('retry')}</button>{error === 'playback_login' && <a href="/create">{t('open')}</a>}</div>}</main>;
  const r = snapshot.runtime;
  const seconds = Math.max(0, Math.floor((clock + snapshot.clockOffset - r.startedAt) / 1000));
  return <main className={`live-presentation ${role === 'presenter' ? 'is-presenter' : 'is-audience'}`} onPointerMove={wake}>
    {role === 'presenter' && <header className="live-heading"><span>{t('presenter')}</span><span className={connected ? 'live-connected' : ''}>{t(connected ? 'connected' : 'reconnecting')}</span><time>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</time></header>}
    <div className="live-layout"><div className="live-stage-wrap"><div className="live-stage" ref={stage} />
      <svg className={`live-ink tool-${tool}`} viewBox="0 0 1280 720" aria-label={t('canvas')} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { pointer.current = null; laserPoint.current = null; draftRef.current = null; setDraft(null); requestQueue.current.clear(); }}>
        {renderedInk}
        {!r.black && Object.entries(lasers).map(([id, p]) => <circle key={id} cx={p.point[0] * 1280} cy={p.point[1] * 720} r="7" fill="#ef4444" className="live-laser" />)}
      </svg>{r.black && <div className="live-black" onClick={() => void operate("next")} />}
    </div>
    {role === 'presenter' && <aside className="live-sidebar"><h2>{t('nextSlide')}</h2><div className="live-preview" ref={next} /><h2>{t('notes')}</h2><SpeakerNotesEditor key={`${link}:${r.epoch}:${snapshot.capabilities.isOwner}`} link={link} epoch={r.epoch} slideId={String(snapshot.show.slides[r.index].id)} fallback={snapshot.notes?.[r.index] || ''} isOwner={snapshot.capabilities.isOwner} /><p>{t('sharedHint')}</p></aside>}</div>
    <div className={`live-toolbar ${controls || role === 'presenter' || tool !== 'browse' || !connected ? '' : 'is-hidden'}`} onFocus={wake} role="toolbar" aria-label={t('controls')}>
      <button disabled={!canOperate} onClick={() => void operate('previous')} title={t('previous')} aria-label={t('previous')}><ChevronLeft size={20} /></button><span className="live-page-count">{r.index + 1} / {snapshot.show.slides.length}</span><button disabled={!canOperate} onClick={() => void operate('next')} title={t('next')} aria-label={t('next')}><ChevronRight size={20} /></button>
      <span className="live-divider" />{(Object.entries(tools) as [Tool, typeof PenLine][]).map(([name, Icon]) => <button key={name} disabled={!canOperate} aria-label={t(name)} title={t(name)} aria-pressed={tool === name} onClick={() => setTool(name)}><Icon size={18} /></button>)}
      {(tool === 'pen' || tool === 'highlighter') && <><select aria-label={t('color')} value={color} disabled={!canOperate} onChange={e => setColor(e.target.value)}>{colors.map((c, i) => <option key={c} value={c}>{t(`colors.${i}`)}</option>)}</select><select aria-label={t('width')} value={width} disabled={!canOperate} onChange={e => setWidth(Number(e.target.value))}>{[3, 6, 12].map((w, i) => <option key={w} value={w}>{t(`widths.${i}`)}</option>)}</select></>}
      <button disabled={!canOperate} onClick={() => void operate('clear')} aria-label={t('clear')} title={t('clear')}><Trash2 size={18} /></button><button disabled={!canOperate} onClick={() => void operate('black')} aria-pressed={r.black} aria-label={t('black')} title={t('black')}><Scan size={18} /></button><span className="live-divider" /><button onClick={fullscreen} aria-label={t('fullscreen')} title={t('fullscreen')}><Expand size={18} /></button>
      {snapshot.capabilities.isOwner && <button disabled={!connected} onClick={() => { if (window.confirm(t('endConfirm'))) void operate('end'); }} aria-label={t('end')} title={t('end')}><X size={18} /></button>}
    </div><div className="live-status" role="status">{!connected ? t('reconnecting') : !canOperate ? t('readOnly') : notice}</div>
  </main>;
}
function PresentationStatus({ text }: { text: string }) { return <p role="status">{text}</p>; }
