

export type ToolbarFamily = 'text' | 'content' | 'media' | 'items' | 'composition' | 'edge-media' | 'layout';

export interface LucideRuntime {
  icons?: Record<string, unknown>;
  createElement?: (icon: unknown, attributes: Record<string, string | number>) => Element;
  [name: string]: unknown;
}

export interface DecorationRecord {
  toolbar: HTMLElement;
  cleanup: () => void;
  refreshLocale: () => void;
}

export interface ToolbarAnchorRecord {
  anchor: HTMLElement;
  slide: HTMLElement;
  layer: HTMLElement;
  nextSibling: ChildNode | null;
  alignMenu?: {
    menu: HTMLElement;
    parent: HTMLElement;
    nextSibling: ChildNode | null;
    style: string | null;
    placement: string | null;
    hidden: boolean;
  };
}

export interface ToolbarPreviewController {
  readonly enabled: boolean;
  setEnabled(enabled: boolean): void;
  refresh(): void;
  dispose(): void;
}

export type YrkieDoeToolbarController = ToolbarPreviewController;
