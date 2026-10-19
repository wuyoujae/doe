import type { DOE_COMPONENT_LIBRARY } from "../../../catalog/index.ts";

export type UnknownRecord = Record<string, any>;

export interface ContentEditRequest {
  type: string;
  props: UnknownRecord;
  element: HTMLElement;
  apply(props: UnknownRecord): Promise<void>;
}

export interface ContentForm {
  element: HTMLFormElement;
  dispose?(): void;
  read(): { props: UnknownRecord; error?: never } | { error: string; props?: never };
}

export interface ContentEditorDefinition {
  label: string;
  renderer: string;
  placement?: 'right';
  readOnly?: boolean;
  createPreview?(container: HTMLElement, source: HTMLElement): { render(props: UnknownRecord): Promise<boolean>; dispose(): void };
  createForm(props: UnknownRecord, onChange: () => void): ContentForm;
}

export interface ContentEditorBridge {
  componentLibrary?: typeof DOE_COMPONENT_LIBRARY;
  openIcon?(request: ContentEditRequest): void;
  openLogo?(request: Omit<ContentEditRequest, 'type'>): void;
  openBackground?(request: Omit<ContentEditRequest, 'type'>): void;
  labels?: { edit: string; replace?: string; replaceImage?: string; toolbar: string; changed: string; overflow: string };
  supports(type: string): boolean;
  open(request: ContentEditRequest): void;
}
