import type { SlideSchemaDeck } from './schema-deck';

export type StreamingSlideRender = {
  generationId: string;
  deck: SlideSchemaDeck;
  readyBlockCount: number;
  updateVersion: number;
  status: 'streaming' | 'committed';
  revision?: number;
};
