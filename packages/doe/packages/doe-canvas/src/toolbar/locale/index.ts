export interface ToolbarLocale {
  on(event: 'languageChanged', listener: () => void): unknown;
  off(event: 'languageChanged', listener: () => void): unknown;
  localizeToolbar(roots: HTMLElement[]): { refresh(): void; dispose(): void };
}
