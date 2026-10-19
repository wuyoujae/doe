import type { SlideSchemaDeck, SlideSchemaSlide } from '../../storage/schema-deck/index.ts';

// Key ordering is irrelevant; arrays (including component order) remain ordered.
export function sameContent(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length
      && a.every((value, index) => sameContent(value, b[index]));
  }
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  return Object.keys(left).length === Object.keys(right).length
    && Object.keys(left).every((key) => Object.hasOwn(right, key) && sameContent(left[key], right[key]));
}

export function mergeSavedDeck(base: SlideSchemaDeck, local: SlideSchemaDeck, remote: SlideSchemaDeck): SlideSchemaDeck {
  const choose = <T,>(before: T, ours: T, theirs: T): T => {
    if (sameContent(ours, before) || sameContent(ours, theirs)) return theirs;
    if (sameContent(theirs, before)) return ours;
    throw new Error('schema-deck-revision-conflict');
  };
  const metadata = (value: SlideSchemaDeck): SlideSchemaDeck => ({ ...value, deck: { ...value.deck, slides: [] } });
  const result = structuredClone(choose(metadata(base), metadata(local), metadata(remote)));
  const ids = (value: SlideSchemaDeck) => value.deck.slides.map((slide) => slide.id);
  const order = choose(ids(base), ids(local), ids(remote));
  const byId = (value: SlideSchemaDeck) => new Map(value.deck.slides.map((slide) => [slide.id, slide]));
  const [before, ours, theirs] = [byId(base), byId(local), byId(remote)];
  const slides = new Map<string, SlideSchemaSlide>();
  for (const id of new Set([...before.keys(), ...ours.keys(), ...theirs.keys()])) {
    const slide = choose(before.get(id), ours.get(id), theirs.get(id));
    if (slide) slides.set(id, slide);
  }
  result.deck.slides = order.map((id) => {
    const slide = slides.get(id);
    if (!slide) throw new Error('schema-deck-revision-conflict');
    return structuredClone(slide);
  });
  return result;
}

export type DoeSlideEditEvent = {
  sessionId: string;
  slideId: string;
  revision: number;
  previousRevision: number;
  slide: SlideSchemaSlide;
};

export function parseDoeSlideEditEvent(value: unknown): DoeSlideEditEvent | null {
  if (!value || typeof value !== 'object') return null;
  const event = value as DoeSlideEditEvent;
  return typeof event.sessionId === 'string' && typeof event.slideId === 'string'
    && Number.isSafeInteger(event.revision) && event.revision > 0
    && Number.isSafeInteger(event.previousRevision) && event.previousRevision > 0
    && event.revision === event.previousRevision + 1
    && event.slide?.id === event.slideId && Array.isArray(event.slide.blocks) ? event : null;
}

export type DoeAgentPreparation = { sessionId: string; prepare: () => Promise<string | null> };
