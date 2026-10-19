export type UnknownRecord = Record<string, any>;

export const EFFECTS = { fade: 'Fade', rise: 'Rise', zoom: 'Zoom', pulse: 'Pulse', exit: 'Exit' } as const;
export const TRIGGERS = { click: 'On click', with: 'With previous', after: 'After previous' } as const;
export type Cue = { id: string; target: string; effect: keyof typeof EFFECTS; trigger: keyof typeof TRIGGERS; duration: number; delay: number };
export type PageMotion = { cues: Cue[]; transition: 'none' | 'fade' | 'push'; notes: string };
export type ScheduledCue = Cue & { group: number; start: number; end: number };
export type Position = { index: number; step: number; at: number; black: boolean; revision: number };
export type Show = { slides: UnknownRecord[]; theme: unknown; pageNumber: unknown; logo?: unknown; motion: Omit<PageMotion, 'notes'>[] };
const record = (v: unknown): v is UnknownRecord => !!v && typeof v === 'object' && !Array.isArray(v);
const bounded = (v: unknown, fallback: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;

export function pageMotion(value?: unknown): PageMotion {
  const v = record(value) ? value : {};
  return {
    transition: v.transition === 'none' || v.transition === 'push' ? v.transition : 'fade',
    notes: typeof v.notes === 'string' ? v.notes.slice(0, 20000) : '',
    cues: (Array.isArray(v.cues) ? v.cues : []).filter((c): c is Cue => record(c)
      && typeof c.id === 'string' && typeof c.target === 'string'
      && typeof c.effect === 'string' && typeof c.trigger === 'string'
      && Object.hasOwn(EFFECTS, c.effect) && Object.hasOwn(TRIGGERS, c.trigger)).slice(0, 200)
      .map(c => ({ id: c.id, target: c.target, effect: c.effect, trigger: c.trigger,
        duration: bounded(c.duration, 480, 80, 10000), delay: bounded(c.delay, 0, 0, 30000) })),
  };
}

export function targets(slide: UnknownRecord): { id: string; label: string }[] {
  const found: { id: string; label: string }[] = [];
  function visit(blocks: unknown) {
    if (!Array.isArray(blocks)) return;
    for (const block of blocks.filter(record)) {
      const props = record(block.props) ? block.props : {};
      if (typeof block.id === 'string') found.push({ id: block.id,
        label: `${block.type === 'layout-group' ? 'Group' : block.type} · ${String(props.title || props.text || block.id).slice(0, 42)}` });
      if (Array.isArray(block.children)) visit(block.children);
    }
  }
  visit(slide.blocks);
  return found;
}

export function timeline(cues: Cue[]): ScheduledCue[] {
  let group = 0;
  let previousStart = 0;
  let previousEnd = 0;
  return cues.map(cue => {
    if (cue.trigger === 'click') { group++; previousStart = 0; previousEnd = 0; }
    const start = (cue.trigger === 'after' ? previousEnd : cue.trigger === 'with' ? previousStart : 0) + cue.delay;
    previousStart = start;
    previousEnd = start + cue.duration;
    return { ...cue, group, start, end: previousEnd };
  });
}

export function steps(motion: Pick<PageMotion, 'cues'>): number {
  return motion.cues.filter(c => c.trigger === 'click').length;
}

export function navigate(show: Show, state: Position, direction: 1 | -1, now = Date.now()): Position {
  let { index, step } = state;
  if (direction === 1) {
    if (step < steps(show.motion[index])) step++;
    else if (index < show.slides.length - 1) { index++; step = 0; }
  } else if (step > 0) step--;
  else if (index > 0) { index--; step = steps(show.motion[index]); }
  // Backward navigation reconstructs a stable state, without replaying older effects.
  return { ...state, index, step, at: direction < 0 ? 0 : now, revision: state.revision + 1 };
}

export function audienceShow(deck: UnknownRecord, motions: Record<string, PageMotion>): Show {
  const source = record(deck.deck) ? deck.deck : {};
  const slides = structuredClone(Array.isArray(source.slides) ? source.slides.filter(record) : []);
  if (!slides.length) throw new Error('No slides available');
  // Notes may also have arrived from an imported/local source; never transmit them.
  const strip = (node: UnknownRecord) => {
    for (const key of Object.keys(node)) {
      if (/^(notes|speakerNotes|presenterNotes)$/i.test(key)) delete node[key];
      else if (Array.isArray(node[key])) node[key].forEach((v: unknown) => { if (record(v)) strip(v); });
      else if (record(node[key])) strip(node[key]);
    }
  };
  slides.forEach(slide => { strip(slide); slide.editor = false; });
  return { slides, theme: source.theme, pageNumber: deck.pageNumber, logo: deck.logo,
    motion: slides.map(slide => {
      const p = pageMotion(motions[String(slide.id)]);
      const ids = new Set(targets(slide).map(t => t.id));
      return { transition: p.transition, cues: p.cues.filter(c => ids.has(c.target)) };
    }) };
}

export function validPosition(v: unknown, show: Show): v is Position {
  return record(v) && typeof v.index === 'number' && Number.isInteger(v.index) && v.index >= 0 && v.index < show.slides.length
    && typeof v.step === 'number' && Number.isInteger(v.step) && v.step >= 0 && v.step <= steps(show.motion[v.index])
    && typeof v.at === 'number' && Number.isFinite(v.at) && v.at >= 0 && typeof v.black === 'boolean'
    && typeof v.revision === 'number' && Number.isSafeInteger(v.revision) && v.revision >= 0;
}
