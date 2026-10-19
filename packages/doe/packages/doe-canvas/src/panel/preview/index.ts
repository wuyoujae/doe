import { t } from "../../../../doe-component/src/shared/editor/i18n/index.ts";
import previewCssUrl from './index.css?no-inline&url';
import type { UnknownRecord } from "../../../../doe-component/src/shared/editor/types/index.ts";

type Renderer = { mount(host: HTMLElement, props: UnknownRecord): { size: { width: number; height: number } }; measure?(props: UnknownRecord): { contentFits?: boolean }; parseFormula?: (formula: string) => { warnings: string[] }; dispose?: (host: HTMLElement) => void };
type RenderWindow = Window & { PPTComponents: Record<string, Renderer>; SlideEngine: { components: Map<string, { prepareConfig?(props: UnknownRecord): UnknownRecord; render(component: { props: UnknownRecord }, context: { element: (tag: string, className?: string, text?: string) => HTMLElement }): HTMLElement }> } };

/** Isolated styles with the exact renderer and theme already used by the Canvas. */
export class ContentPreview {
  private frame = document.createElement('iframe');
  private ready: Promise<void>;
  private observer: ResizeObserver;
  private disposed = false;
  private generation = 0;
  private size = { width: 640, height: 400 };
  private rejectReady: ((reason: Error) => void) | undefined;
  private loadTimer = 0;
  private props: UnknownRecord | undefined;
  private resizeFrame = 0;

  constructor(private container: HTMLElement, private source: HTMLElement, private renderer: string, private componentType = renderer) {
    this.frame.title = t('preview.frame'); this.frame.tabIndex = -1;
    this.frame.setAttribute('sandbox', 'allow-same-origin');
    const links = [...source.ownerDocument.querySelectorAll<HTMLLinkElement>('head link[rel="stylesheet"]')]
      .filter(link => !link.href.includes('work-editor.css'))
      .map(link => { const copy = link.cloneNode() as HTMLLinkElement; copy.href = link.href; return copy.outerHTML; }).join('');
    this.ready = new Promise((resolve, reject) => {
      this.rejectReady = reject;
      this.loadTimer = window.setTimeout(() => reject(new Error(t('preview.timeout'))), 20000);
      this.frame.onload = () => {
        const doc = this.frame.contentDocument;
        if (!doc?.getElementById('chart-preview')) return;
        clearTimeout(this.loadTimer);
        const computed = source.ownerDocument.defaultView!.getComputedStyle(source);
        for (const name of computed) if (name.startsWith('--')) doc.documentElement.style.setProperty(name, computed.getPropertyValue(name));
        resolve();
      };
    });
    void this.ready.catch(() => {});
    const previewStyle = document.createElement('link');
    previewStyle.rel = 'stylesheet'; previewStyle.href = previewCssUrl;
    this.frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8">${links}${previewStyle.outerHTML}</head><body><div id="chart-preview"></div></body></html>`;
    container.append(this.frame);
    this.observer = new ResizeObserver(() => {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => { if (!this.disposed && this.props) this.mount(this.props); });
    }); this.observer.observe(container);
  }

  private resize() {
    const host = this.frame.contentDocument?.getElementById('chart-preview');
    if (!host) return;
    const scale = Math.min((this.container.clientWidth - 40) / this.size.width, (this.container.clientHeight - 40) / this.size.height, 1);
    host.style.transform = `translate(-50%, -50%) scale(${Math.max(0.05, scale)})`;
  }

  private mount(props: UnknownRecord) {
    const runtime = this.source.ownerDocument.defaultView as unknown as RenderWindow;
    const host = this.frame.contentDocument!.getElementById('chart-preview')!;
    if (['code-block', 'media', 'mathFormula'].includes(this.renderer)) {
      const doc = host.ownerDocument;
      doc.body.style.overflow = 'auto';
      host.style.cssText = 'position:relative;left:0;top:0;transform:none;margin:1.25rem;pointer-events:auto';
      if (this.renderer === 'media') {
        host.replaceChildren();
        const original = this.source.querySelector('img');
        if (original) {
          const img = doc.createElement('img'); img.src = typeof props.src === 'string' ? props.src : original.currentSrc || original.src; img.alt = original.alt;
          img.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain';
          host.style.height = `${Math.max(80, this.container.clientHeight - 40)}px`; host.append(img);
        }
      } else if (this.renderer === 'code-block') {
        const definition = runtime.SlideEngine.components.get('code-block');
        if (!definition) throw new Error(t('preview.notReady'));
        const element = (tag: string, className = '', text?: string) => {
          const node = doc.createElement(tag); node.className = className;
          if (text !== undefined) node.textContent = text;
          return node;
        };
        host.replaceChildren(definition.render({ props: structuredClone(props) }, { element }));
      } else {
        const renderer = runtime.PPTComponents.mathFormula;
        if (renderer.parseFormula?.(props.content?.formula || '').warnings.length) throw new Error(t('source.invalidFormula'));
        renderer.mount(host, { ...structuredClone(props), size: { width: Math.max(200, this.container.clientWidth - 40), height: Math.max(120, this.container.clientHeight - 40) } });
        host.style.overflow = 'visible';
        const body = host.querySelector<HTMLElement>('.ppt-math-formula__body');
        const math = host.querySelector('math');
        if (body && math) {
          body.style.overflow = 'visible';
          host.style.width = `${Math.max(host.clientWidth, math.getBoundingClientRect().width + 24)}px`;
          host.style.height = `${Math.max(host.clientHeight, math.getBoundingClientRect().height + 24)}px`;
        }
      }
      return;
    }
    const renderer = runtime.PPTComponents[this.renderer];
    if (!renderer) throw new Error(t('preview.notReady'));
    let config = structuredClone(props);
    if (renderer.measure) {
      config = runtime.SlideEngine.components.get(this.componentType)?.prepareConfig?.(config) ?? config;
      if (renderer.measure(config).contentFits === false) throw new Error(t('errors.layoutOverflow'));
    }
    // Preview owns this viewport. Reflow at its available width instead of
    // retaining the component's old Canvas slot or a default intrinsic size.
    host.style.transform = 'translate(-50%, -50%)';
    const width = Math.max(440, this.container.clientWidth - 40);
    this.size = renderer.mount(host, { ...config, size: {
      width, height: Math.max(300, this.container.clientHeight - 40),
    } }).size;
    this.resize();
  }

  async render(props: UnknownRecord): Promise<boolean> {
    const generation = ++this.generation;
    await this.ready;
    if (this.disposed || generation !== this.generation) return false;
    await this.frame.contentDocument!.fonts.ready;
    await this.source.ownerDocument.fonts.ready;
    if (this.disposed || generation !== this.generation) return false;
    const draft = structuredClone(props);
    this.mount(draft);
    this.props = draft;
    // The first mount requests font faces that an empty iframe did not need.
    await this.frame.contentDocument!.fonts.ready;
    if (this.disposed || generation !== this.generation) return false;
    this.mount(this.props);
    return true;
  }

  dispose() {
    this.disposed = true; this.generation++;
    clearTimeout(this.loadTimer);
    cancelAnimationFrame(this.resizeFrame);
    this.rejectReady?.(new Error(t('preview.closed')));
    const host = this.frame.contentDocument?.getElementById('chart-preview') as (HTMLElement & { __pptDataTableResizeObserver?: ResizeObserver }) | null;
    host?.__pptDataTableResizeObserver?.disconnect();
    if (host) (this.source.ownerDocument.defaultView as unknown as RenderWindow).PPTComponents[this.renderer]?.dispose?.(host);
    this.observer.disconnect(); this.frame.remove();
  }
}
