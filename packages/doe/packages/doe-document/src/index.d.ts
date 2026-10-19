export interface PresentationDefinition {
  readonly id: 'presentation';
  readonly schemaVersion: 4;
  readonly canvas: { readonly width: number; readonly height: number; readonly unit: string; readonly renderWidth: number; readonly renderHeight: number };
  compile(input: unknown, options?: Record<string, unknown>): { schema: unknown; diagnostics: unknown[] };
  parse(input: unknown): Record<string, unknown>;
  applyIntent(slide: unknown, intent?: Record<string, unknown>): { changed: boolean; slide: unknown; selectedId: string | null };
}
export const presentation: PresentationDefinition;
export const documentDefinitions: Readonly<{ presentation: PresentationDefinition }>;
export function getDocumentDefinition(id: string): PresentationDefinition | undefined;
export function createPresentationCanvasRenderer(engine: Pick<import('@yrkie/doe-canvas').DoeCanvasRenderer, 'mount' | 'sanitizeStaticElement'>): import('@yrkie/doe-canvas').DoeCanvasRenderer;
