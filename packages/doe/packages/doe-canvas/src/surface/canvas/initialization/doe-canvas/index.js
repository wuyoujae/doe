import { resolveCanvasMode, applyCanvasMode } from '../../../../../../doe-core/src/runtime/canvas-mode/index.js';
import { decodeImage as __doeFn_decodeImage } from '../../decode-image/index.js';
import { waitForAssets as __doeFn_waitForAssets } from '../../wait-for-assets/index.js';
// Origin: public/yrkie-doe/canvas/canvas.js:29
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.DoeCanvas = class DoeCanvas extends HTMLElement {
    get renderer() { return this.documentRenderer || __doeScope.renderer; }
    set renderer(value) {
      if (value === this.renderer) return;
      this.dispose(); this.documentRenderer = value;
      this.initialize(); this.applyDocumentSize(); this.resize();
    }
    applyDocumentSize(staging) {
      const size = this.renderer.size;
      for (const element of [this.scaleElement, this.canvasElement, staging].filter(Boolean)) {
        for (const axis of ['width', 'height']) {
          if (element.style[axis]) element.style.removeProperty(axis);
          const natural = Number.parseFloat(__doeScope.global.getComputedStyle(element)[axis]);
          if (natural !== size[axis]) element.style[axis] = `${size[axis]}px`;
        }
      }
    }
    connectedCallback() {
      this.initialize();
      if (typeof ResizeObserver === "function") {
        this.observer ||= new ResizeObserver(() => this.resize());
        this.observer.observe(this);
      }
      this.resize();
    }
    disconnectedCallback() { this.dispose(); this.observer?.disconnect(); }
    initialize() {
      if (this.canvasElement) return;
      this.classList.add("doe-canvas");
      this.scaleElement = this.querySelector("[data-canvas-scale]") || document.createElement("div");
      this.scaleElement.classList.add("doe-canvas__scale");
      this.canvasElement = this.scaleElement.querySelector("[data-canvas-mount]") || document.createElement("div");
      this.canvasElement.classList.add("doe-canvas__mount");
      if (!this.canvasElement.parentNode) this.scaleElement.append(this.canvasElement);
      if (!this.scaleElement.parentNode) this.append(this.scaleElement);
      this.applyDocumentSize();
    }
    resize() {
      this.initialize();
      if (!this.clientWidth || !this.clientHeight) return false;
      const scale = Math.max(0.05, this.clientWidth / this.renderer.size.width, this.clientHeight / this.renderer.size.height);
      this.scaleElement.style.setProperty("--editor-scale", scale.toFixed(6));
      return true;
    }
    beginRender(options) {
      this.dispose(); this.initialize();
      const controller = new AbortController(); this.controller = controller;
      const abort = () => controller.abort(options.signal.reason);
      if (options.signal?.aborted) abort();
      else options.signal?.addEventListener("abort", abort, { once: true });
      this.unlinkSignal = () => options.signal?.removeEventListener("abort", abort);
      return controller.signal;
    }
    get mode() { return this.dataset.canvasMode || resolveCanvasMode({ mode: this.getAttribute('mode') || undefined, editable: this.getAttribute('editable') === 'false' ? false : undefined }); }
    async mount(schema, options = {}) {
      const mode = resolveCanvasMode({ ...options, mode: options.mode ?? this.getAttribute('mode') ?? undefined,
        editable: this.getAttribute('editable') === 'false' ? false : options.editable });
      if (mode === 'present') return this.renderReadOnly(schema, options, 'present');
      const signal = this.beginRender(options);
      this.dataset.canvasMode = mode; applyCanvasMode(this.canvasElement, mode);
      const result = await this.renderer.mount(this.canvasElement, schema, {
        ...options, signal, mode, editable: mode === "editable",
      });
      if (signal.aborted) { result.dispose(); (0, __doeScope.throwIfAborted)(signal); }
      this.mounted = result;
      this.resize();
      return result;
    }
    async renderStatic(schema, options = {}) { return this.renderReadOnly(schema, options, 'static'); }
    async renderReadOnly(schema, options, mode) {
      const signal = this.beginRender(options);
      this.dataset.canvasMode = mode; applyCanvasMode(this.canvasElement, mode);
      const staging = document.createElement("div"); staging.className = "doe-canvas__staging";
      staging.setAttribute("aria-hidden", "true"); document.body.append(staging);
      this.applyDocumentSize(staging);
      let mounted, retained = false;
      try {
        mounted = await this.renderer.mount(staging, schema, { ...options, signal, mode, editable: false });
        const images = [...staging.querySelectorAll("img")];
        for (const source of this.renderer.backgroundAssets?.(schema) || []) {
          const image = document.createElement("img"); image.src = source; images.push(image);
        }
        const assets = images.map(__doeFn_decodeImage);
        if (!options.progressiveAssets && document.fonts?.ready) assets.push(document.fonts.ready);
        const assetsReady = options.progressiveAssets
          ? Promise.allSettled(assets).then(results => results.some(result => result.status === "rejected"))
          : Promise.all(assets).then(() => false);
        const assetsPending = await (0, __doeFn_waitForAssets)(assetsReady, signal, options.progressiveAssets ? 1200 : 15000, options.progressiveAssets);
        await new Promise((resolve, reject) => {
          const finish = error => { __doeScope.global.cancelAnimationFrame(frame); signal.removeEventListener("abort", abort); error ? reject(error) : resolve(); };
          const abort = () => finish(new DOMException("Canvas disposed", "AbortError"));
          let frame = __doeScope.global.requestAnimationFrame(() => { frame = __doeScope.global.requestAnimationFrame(() => finish()); });
          signal.addEventListener("abort", abort, { once: true });
          if (signal.aborted) abort();
        });
        await mounted.flushPendingEdits();
        if (mode === 'present') {
          (0, __doeScope.throwIfAborted)(signal);
          staging.className = 'doe-canvas__live'; staging.removeAttribute('aria-hidden');
          staging.style.width = `${this.renderer.size.width}px`; staging.style.height = `${this.renderer.size.height}px`;
          this.canvasElement.replaceChildren(staging); this.mounted = mounted; retained = true;
          this.resize();
          return Object.assign(mounted, options.progressiveAssets ? { assetsReady, assetsPending } : {});
        }
        const snapshot = await mounted.captureStaticSnapshot();
        (0, __doeScope.throwIfAborted)(signal);
        applyCanvasMode(snapshot.element, "static");
        this.canvasElement.replaceChildren(snapshot.element);
        this.resize();
        return { ...snapshot, ...(options.progressiveAssets ? { assetsReady, assetsPending } : {}) };
      } finally { if (!retained) { mounted?.dispose(); staging.remove(); } }
    }
    clearInteractions() { this.mounted?.clearInteractions?.(); }
    clearSelection() { return this.mounted?.clearSelection() || Promise.resolve(); }
    flushPendingEdits() { return this.mounted?.flushPendingEdits() || Promise.resolve(); }
    dispose() {
      this.controller?.abort(); this.unlinkSignal?.(); this.unlinkSignal = null;
      this.mounted?.dispose(); this.mounted = null;
    }
  };
}
