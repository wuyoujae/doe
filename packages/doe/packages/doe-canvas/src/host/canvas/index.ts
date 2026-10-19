export type DoeCanvasMode = 'editable' | 'present' | 'static';
export interface DoeCanvasOptions {
  mode?: DoeCanvasMode;
  theme?: unknown;
  signal?: AbortSignal;
  editable?: boolean;
  pageNumber?: unknown;
  logo?: unknown;
  waitForFonts?: boolean;
  progressiveAssets?: boolean;
  /** Explicit Studio experiment; omitted in Work/Share. Never stored in author data. */
  flowLayout?: { version: 'flow-v1'; pageMarginPt?: 12 | 20 | 24 | 36 | 48 | 56 | 64 | 72; pageMarginVerticalPt?: 12 | 20 | 24 | 36 | 48 | 56 | 64 | 72; compression?: 'local-v4' | 'local-v1' | 'page-v1' } | { version: 'legacy' } | null;
}

export type DoeCanvasSnapshot = { element: HTMLElement; assetsReady?: Promise<boolean>; assetsPending?: boolean };
export type DoeComponentInsertion = { name: string; locale?: string; media?: { src: string; alt?: string } };
export type DoeComponentInsertionResult = { accepted: true; blockId: string } | { accepted: false; errorCode: string; reason?: string };

export interface DoeCanvasMount {
  assetsReady?: Promise<boolean>;
  assetsPending?: boolean;
  element: HTMLElement;
  clearSelection(): Promise<void>;
  clearInteractions?(): void;
  flushPendingEdits(): Promise<void>;
  /** Presentation renderers insert through the same layout/undo transaction as inline edits. */
  insertComponent?(request: DoeComponentInsertion, isCurrent?: () => boolean): Promise<DoeComponentInsertionResult>;
  captureStaticSnapshot(): Promise<{ element: HTMLElement }>;
  dispose(): void;
}

export interface DoeCanvasRenderer<Schema = unknown> {
  readonly id: string;
  readonly size: { readonly width: number; readonly height: number };
  mount(target: HTMLElement | string, schema: Schema, options?: DoeCanvasOptions): Promise<DoeCanvasMount>;
  sanitizeStaticElement(element: HTMLElement): HTMLElement;
  backgroundAssets?(schema: Schema): string[];
}

/** Public light-DOM component registered by the canonical DOE runtime document. */
export interface DoeCanvasElement extends HTMLElement {
  renderer: DoeCanvasRenderer;
  readonly mode: DoeCanvasMode;
  readonly canvasElement: HTMLElement;
  readonly scaleElement: HTMLElement;
  resize(): boolean;
  mount(schema: unknown, options?: DoeCanvasOptions): Promise<DoeCanvasMount>;
  renderStatic(schema: unknown, options?: DoeCanvasOptions): Promise<DoeCanvasSnapshot>;
  clearSelection(): Promise<void>;
  clearInteractions?(): void;
  flushPendingEdits(): Promise<void>;
  dispose(): void;
}
