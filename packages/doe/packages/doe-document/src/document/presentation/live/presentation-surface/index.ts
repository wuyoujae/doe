import canvas from '../../canvas/base-attributes/index.json';
import { bindPresentationInput } from '../../../../../../doe-canvas/src/interaction/presentation-input/index.ts';
import type { DoeCanvasMode } from '../../../../../../doe-canvas/src/host/canvas/index.ts';
import { readOnlyRuntimeDocument as runtimeDocument } from '../../../../../../../runtimes/read-only/loader/index.ts';
import { timeline, type Position, type Show, type Cue } from '../presentation-model/index.ts';
import type { UnknownRecord } from '../presentation-model/index.ts';

type Mounted = { clearInteractions?(): void; element: HTMLElement; dispose(): void; flushPendingEdits(): Promise<void>; captureStaticSnapshot(): Promise<{ element: HTMLElement }> };
type Runtime = Window & { SlideEngine: { mount(host: HTMLElement, schema: unknown, options: unknown): Promise<Mounted> } };
type Page = { host: HTMLElement; animations: Animation[]; ready: Promise<void>; controller: AbortController; mounted?: Mounted };


const finishStyle = (effect: Cue['effect']): Keyframe => effect === 'exit'
  ? { opacity: 0 } : effect === 'pulse' ? { scale: '1' } : { opacity: 1, translate: '0 0', scale: '1' };
const keyframes = (effect: Cue['effect']): Keyframe[] => {
  if (effect === 'exit') return [{ opacity: 1 }, { opacity: 0 }];
  if (effect === 'pulse') return [{ scale: '1' }, { scale: '1.045', offset: 0.45 }, { scale: '1' }];
  return [{ opacity: 0, translate: effect === 'rise' ? '0 28px' : '0 0', scale: effect === 'zoom' ? '.94' : '1' }, finishStyle(effect)];
};

/** A bounded live canvas retains component interactions until its page is evicted. */
export class PresentationSurface {
  private frame = document.createElement('iframe');
  private ready: Promise<void>;
  private pages = new Map<number, Page>();
  private observer: ResizeObserver;
  private generation = 0;
  private disposed = false;
  private visible = -1;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private last: Position | null = null;
  private controller = new AbortController();
  private transitions: Animation[] = [];
  private wanted = -1;
  private preview = false;
  private unbindInput?: () => void;

  constructor(private container: HTMLElement, private show: Show, private report: (error: string) => void, private options: { install?: (frame: HTMLIFrameElement) => boolean; now?: () => number; title?: string; mode?: Exclude<DoeCanvasMode, "editable"> } = {}) {
    this.frame.title = this.options.title || 'Slide canvas'; this.frame.referrerPolicy = 'no-referrer'; this.frame.tabIndex = -1; this.frame.className = 'presentation-canvas';
    this.ready = new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('Playback runtime timed out')), 20000);
      this.controller.signal.addEventListener('abort', () => { clearTimeout(timeout); reject(new DOMException('Playback disposed', 'AbortError')); }, { once: true });
      this.frame.onload = () => {
        if (!this.frame.contentDocument?.getElementById('surface')) return;
        clearTimeout(timeout);
        if (this.disposed) return;
        try {
          if (this.options.install && !this.options.install(this.frame)) {
            throw new Error('Component runtime unavailable');
          }
          if (this.options.mode !== 'static') this.unbindInput = bindPresentationInput(this.frame, this.container);
          this.resize(); resolve();
        } catch (error) { reject(error); }
      };
      void runtimeDocument(this.controller.signal).then(html => {
        if (!this.disposed) this.frame.srcdoc = html;
      }, error => { clearTimeout(timeout); reject(error); });
    });
    // A surface can be disposed before its first render starts awaiting readiness.
    void this.ready.catch(() => {});
    container.append(this.frame);
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(container);
    this.reduced.addEventListener('change', this.resync);
    document.addEventListener('visibilitychange', this.resync);
  }

  private resync = () => { if (this.last && !document.hidden) void this.render(this.last, this.preview); };
  private resize() {
    const stage = this.frame.contentDocument?.getElementById('surface');
    if (stage) stage.style.transform = `translate(-50%,-50%) scale(${Math.min(this.container.clientWidth / canvas.renderWidth, this.container.clientHeight / canvas.renderHeight)})`;
  }

  private async prepare(index: number): Promise<Page> {
    await this.ready;
    if (this.disposed) throw new DOMException('Playback disposed', 'AbortError');
    const cached = this.pages.get(index); if (cached) { await cached.ready; return cached; }
    if (index !== this.wanted && index !== this.wanted + 1) throw new DOMException('Obsolete prerender', 'AbortError');
    const doc = this.frame.contentDocument!;
    const host = doc.createElement('div'); host.className = 'play-page'; host.setAttribute('aria-hidden', 'true'); host.inert = true;
    // Layout negotiation reads DOM geometry. Keep it at 1:1 until the renderer
    // finishes measuring, otherwise display scaling feeds back into component heights.
    doc.getElementById('staging')!.append(host);
    const page: Page = { host, animations: [], ready: Promise.resolve(), controller: new AbortController() };
    const signal = AbortSignal.any([page.controller.signal, this.controller.signal]);
    this.pages.set(index, page);
    page.ready = (async () => {
      let mounted: Mounted | undefined;
      try {
        const runtime = this.frame.contentWindow as Runtime;
        mounted = await runtime.SlideEngine.mount(host, { version: 4, slide: this.show.slides[index] }, {
          theme: this.show.theme, signal, mode: this.options.mode || "present", editable: false,
          logo: this.show.logo,
          pageNumber: { ...(this.show.pageNumber as UnknownRecord), current: index + 1, total: this.show.slides.length },
        });
        const background = this.show.slides[index].background as UnknownRecord | null;
        const backgroundImage = doc.createElement('img');
        if (typeof background?.src === 'string') backgroundImage.src = background.src;
        const assets = Promise.all([doc.fonts.ready, ...[...host.querySelectorAll('img')].map(img => img.decode()),
          ...(backgroundImage.src ? [backgroundImage.decode()] : [])]);
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => finish(new Error('Slide assets timed out')), 15000);
          const aborted = () => finish(new DOMException('Playback disposed', 'AbortError'));
          const finish = (error?: unknown) => { clearTimeout(timeout); signal.removeEventListener('abort', aborted); error ? reject(error) : resolve(); };
          signal.addEventListener('abort', aborted, { once: true });
          if (signal.aborted) aborted();
          else void assets.then(() => finish(), finish);
        });
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        await mounted.flushPendingEdits();
        if (signal.aborted || !host.isConnected) throw new DOMException('Obsolete canvas', 'AbortError');
        if (this.options.mode === 'static') {
          const snapshot = await mounted.captureStaticSnapshot();
          if (signal.aborted) throw new DOMException('Obsolete canvas', 'AbortError');
          mounted.dispose(); mounted = undefined; host.replaceChildren(snapshot.element);
        } else { page.mounted = mounted; mounted = undefined; }
        host.inert = true;
        doc.getElementById('surface')!.append(host);
      } catch (error) {
        host.remove(); if (this.pages.get(index) === page) this.pages.delete(index); throw error;
      } finally { mounted?.dispose(); }
    })();
    await page.ready;
    return page;
  }

  async warm(index: number) {
    this.wanted = index;
    for (const [cached, page] of this.pages) if (cached !== this.visible && cached !== index && cached !== index + 1) {
      page.controller.abort(); page.mounted?.dispose(); page.animations.forEach(animation => animation.cancel()); page.host.remove(); this.pages.delete(cached);
    }
    await this.prepare(index);
  }

  async render(state: Position, preview = false) {
    this.last = state;
    this.preview = preview;
    const token = ++this.generation;
    try {
      await this.warm(state.index);
      const page = await this.prepare(state.index);
      if (token !== this.generation || this.disposed) return;
      const changed = this.visible !== state.index;
      const outgoing = this.pages.get(this.visible);
      for (const animation of this.transitions) animation.cancel(); this.transitions = [];
      for (const [index, entry] of this.pages) if (index !== state.index) {
        entry.mounted?.clearInteractions?.(); entry.host.inert = true;
        entry.host.style.opacity = '0'; entry.host.setAttribute('aria-hidden', 'true');
        entry.animations.forEach(animation => animation.pause());
      }
      page.mounted?.clearInteractions?.();
      page.animations.forEach(animation => animation.cancel()); page.animations = [];
      const nodes = new Map<string, HTMLElement>();
      page.host.querySelectorAll<HTMLElement>('[data-block-id]').forEach(node => {
        nodes.set(node.dataset.blockId!, node); node.inert = false;
        node.style.removeProperty('opacity'); node.style.removeProperty('translate'); node.style.removeProperty('scale');
      });
      const cues = timeline(this.show.motion[state.index].cues);
      const first = new Set<string>();
      for (const cue of cues) {
        if (!first.has(cue.target) && ['fade', 'rise', 'zoom'].includes(cue.effect) && !preview) {
          const node = nodes.get(cue.target);
          node?.style.setProperty('opacity', '0'); if (node) node.inert = cue.group > state.step;
        }
        first.add(cue.target);
      }
      if (!preview) for (const cue of cues) {
        const node = nodes.get(cue.target); if (!node || cue.group > state.step) continue;
        const elapsed = state.at ? Math.max(0, (this.options.now?.() ?? Date.now()) - state.at) : Infinity;
        if (this.reduced.matches) {
          Object.assign(node.style, finishStyle(cue.effect)); node.inert = cue.effect === "exit"; continue;
        }
        const complete = cue.group < state.step || elapsed >= cue.end;
        const lead = state.at ? Math.max(0, state.at - (this.options.now?.() ?? Date.now())) : 0;
        const animation = node.animate(keyframes(cue.effect), {
          duration: cue.duration, delay: cue.start + (complete ? 0 : lead), fill: 'forwards', easing: 'cubic-bezier(.16,1,.3,1)',
        });
        animation.currentTime = complete ? cue.end : elapsed;
        if (complete) { animation.pause(); if (cue.effect === "exit") node.inert = true; }
        if (!complete && cue.effect === 'exit') void animation.finished.then(() => {
          if (token !== this.generation || this.disposed || node.ownerDocument.defaultView?.getComputedStyle(node).opacity !== '0') return;
          node.inert = true; page.mounted?.clearInteractions?.();
        }, () => {});
        page.animations.push(animation);
      }
      const direction = state.index >= this.visible ? 1 : -1;
      page.host.inert = this.options.mode === 'static';
      page.host.style.opacity = '1'; page.host.setAttribute('aria-hidden', 'false'); this.visible = state.index;
      const transition = this.show.motion[state.index].transition;
      if (changed && !preview && !this.reduced.matches && transition !== 'none' && state.at > 0 && (this.options.now?.() ?? Date.now()) - state.at < 500) {
        const timing: KeyframeAnimationOptions = { duration: 380, delay: Math.max(0, state.at - (this.options.now?.() ?? Date.now())), fill: 'both', easing: 'cubic-bezier(.16,1,.3,1)' };
        if (outgoing) this.transitions.push(outgoing.host.animate([{ opacity: 1 }, { opacity: 0 }], timing));
        this.transitions.push(page.host.animate([
          { opacity: 0, translate: transition === 'push' ? `${direction * 64}px 0` : '0 0' },
          { opacity: 1, translate: '0 0' },
        ], timing));
      }
      const prune = (retainOutgoing: boolean) => {
        for (const [index, entry] of this.pages) if (Math.abs(index - state.index) > 1 && !(retainOutgoing && entry === outgoing)) {
          entry.controller.abort(); entry.mounted?.dispose(); entry.animations.forEach(animation => animation.cancel()); entry.host.remove(); this.pages.delete(index);
        }
      };
      prune(this.transitions.length > 0);
      if (this.transitions.length) void Promise.allSettled(this.transitions.map(animation => animation.finished)).then(() => {
        if (token === this.generation && !this.disposed) prune(false);
      });
      // One next-page prewarm per surface, using the same asset cache and renderer.
      if (state.index + 1 < this.show.slides.length) void this.prepare(state.index + 1).catch(() => {});
    } catch (error) {
      if (token === this.generation && !this.disposed && !(error instanceof DOMException && error.name === 'AbortError')) {
        this.report(error instanceof Error ? error.message : 'Slide rendering failed');
      }
    }
  }

  dispose() {
    this.disposed = true; this.generation++; this.controller.abort(); this.observer.disconnect();
    this.reduced.removeEventListener('change', this.resync); document.removeEventListener('visibilitychange', this.resync);
    this.transitions.forEach(animation => animation.cancel());
    this.unbindInput?.();
    this.pages.forEach(page => { page.mounted?.dispose(); page.animations.forEach(animation => animation.cancel()); }); this.pages.clear(); this.frame.remove();
  }
}
