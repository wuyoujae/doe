import { registeredThemeId } from '@yrkie/doe/packages/doe-theme/src/registry/index.js';
import { normalizeLogo } from '@yrkie/doe/packages/doe-document/src/document/presentation/schema/logo/index.js';
import { readProject, saveSchemaDeck } from '../../../lib/projects';
import { canonicalImageReference, imagePath, prepareProjectImages } from '../../../lib/project-images';

export type SlidePageNumber = {
  enabled: boolean;
  format: 'number' | 'fraction';
};

export type SlideSchemaSlide = {
  id: string;
  size: {
    width: number;
    height: number;
    unit: 'pt';
  };
  blocks: unknown[];
  [key: string]: unknown;
};

export type SlideSchemaDeck = {
  version: 4;
  pageNumber: SlidePageNumber;
  deck: {
    title: string;
    slides: SlideSchemaSlide[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type SessionSchemaDeck = {
  sessionId: string;
  status: 'active';
  revision: number;
  createdAt: string;
  updatedAt: string;
  deck: SlideSchemaDeck;
};

type ReadSchemaDeckOptions = {
  signal?: AbortSignal;
};

const SLIDE_ASSET_REFERENCE_PATTERN = /^yrkie-asset-data:\/\/([0-9a-f]{64})$/;

// Decks are JSON documents. Older embedded webviews lack structuredClone.
function cloneDeckValue<T>(value: T): T {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export async function readSessionSchemaDeck(sessionId: string, options: ReadSchemaDeckOptions = {}) {
  options.signal?.throwIfAborted();
  const project = await readProject(sessionId);
  await prepareProjectImages(sessionId);
  options.signal?.throwIfAborted();
  return project ? parseSessionSchemaDeck(project.schemaDeck) : null;
}

export async function saveSessionSchemaDeck(sessionId: string, expectedRevision: number, deck: SlideSchemaDeck) {
  return parseSessionSchemaDeck(await saveSchemaDeck(sessionId, expectedRevision, canonicalizeSlideSchemaDeckFromStudio(deck, sessionId)));
}
export function parseSlideSchemaDeck(value: unknown): SlideSchemaDeck {
  const root = plainObject(value) ?? {};
  const deck = plainObject(root.deck) ?? {};
  const rawSlides = Array.isArray(deck.slides) ? deck.slides : [];
  const usedIds = new Set<string>();
  const slides = rawSlides.map((slide, index) => normalizeSlide(slide, index, usedIds));
  const pageNumber = plainObject(root.pageNumber) ?? {};
  const title = typeof deck.title === 'string' && deck.title.trim()
    ? deck.title
    : 'Untitled presentation';

  const normalized = {
    ...root,
    version: 4,
    logo: normalizeLogo(root.logo),
    pageNumber: {
      enabled: typeof pageNumber.enabled === 'boolean' ? pageNumber.enabled : true,
      format: pageNumber.format === 'fraction' ? 'fraction' : 'number',
    },
    deck: {
      ...deck,
      title,
      theme: registeredThemeId(deck.theme),
      slides,
    },
  };
  return cloneDeckValue(normalized) as SlideSchemaDeck;
}

// Retained for targeted diagnostics and contract tests. DOE production read,
// render, and save paths intentionally use the tolerant parser above instead.
export function validateSlideSchemaDeck(value: unknown): SlideSchemaDeck {
  const root = objectRecord(value, 'Deck');
  if (root.version !== 4) throw new Error('Deck version must be 4.');

  const pageNumber = root.pageNumber && typeof root.pageNumber === 'object'
    ? root.pageNumber as Record<string, unknown>
    : {};

  const deck = objectRecord(root.deck, 'Deck body');
  if (typeof deck.title !== 'string' || !deck.title.trim()) {
    throw new Error('Deck title is required.');
  }
  if ([...deck.title].length > 200) throw new Error('Deck title is too long.');
  if (!Array.isArray(deck.slides) || deck.slides.length < 1 || deck.slides.length > 200) {
    throw new Error('Deck must contain between 1 and 200 Slides.');
  }

  const slides = deck.slides.map((value, index) => parseSlide(value, index));
  const ids = new Set(slides.map((slide) => slide.id));
  if (ids.size !== slides.length) throw new Error('Slide ids must be unique.');

  return {
    version: 4,
    ...(Object.hasOwn(root, 'logo') ? { logo: cloneDeckValue(root.logo) } : {}),
    pageNumber: {
      enabled: typeof pageNumber.enabled === 'boolean' ? pageNumber.enabled : true,
      format: pageNumber.format === 'fraction' ? 'fraction' : 'number',
    },
    deck: {
      title: deck.title,
      slides,
    },
  };
}

export function projectSlideSchemaDeckForStudio(
  deck: SlideSchemaDeck,
  sessionId: string,
): SlideSchemaDeck {
  return mapDeckStrings(deck, (value) => {
    const match = SLIDE_ASSET_REFERENCE_PATTERN.exec(value);
    return match ? imagePath(sessionId, match[1]) : value;
  });
}

export function canonicalizeSlideSchemaDeckFromStudio(
  deck: unknown,
  sessionId: string,
): SlideSchemaDeck {
  const assetPathPrefix = sessionAssetPathPrefix(sessionId);
  const canonical = mapDeckStrings(deck, (value) => {
    const localReference = canonicalImageReference(sessionId, value);
    if (localReference !== value) return localReference;
    const path = sameOriginPath(value);
    if (!path?.startsWith(assetPathPrefix)) return value;
    const assetId = path.slice(assetPathPrefix.length);
    return /^[0-9a-f]{64}$/.test(assetId) ? `yrkie-asset-data://${assetId}` : value;
  });
  return parseSlideSchemaDeck(canonical);
}

function parseSessionSchemaDeck(value: unknown): SessionSchemaDeck {
  const record = objectRecord(value, 'Schema Deck record');
  if (typeof record.sessionId !== 'string' || !record.sessionId.trim()) {
    throw new Error('Schema Deck sessionId is invalid.');
  }
  if (record.status !== 'active') throw new Error('Schema Deck status is invalid.');
  if (!Number.isSafeInteger(record.revision) || Number(record.revision) <= 0) {
    throw new Error('Schema Deck revision is invalid.');
  }
  if (typeof record.createdAt !== 'string' || typeof record.updatedAt !== 'string') {
    throw new Error('Schema Deck timestamps are invalid.');
  }

  return {
    sessionId: record.sessionId,
    status: 'active',
    revision: Number(record.revision),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deck: parseSlideSchemaDeck(record.deck),
  };
}

function parseSlide(value: unknown, index: number): SlideSchemaSlide {
  const slide = objectRecord(value, `Slide ${index + 1}`);
  const size = objectRecord(slide.size, `Slide ${index + 1} size`);
  if (typeof slide.id !== 'string' || !slide.id.trim()) {
    throw new Error(`Slide ${index + 1} id is invalid.`);
  }
  if (
    size.width !== 960
    || size.height !== 540
    || size.unit !== 'pt'
  ) {
    throw new Error(`Slide ${index + 1} size is invalid.`);
  }
  if (!Array.isArray(slide.blocks) || slide.blocks.length === 0) {
    throw new Error(`Slide ${index + 1} must contain at least one block.`);
  }

  return cloneDeckValue({
    ...slide,
    id: slide.id,
    size: { ...size, width: size.width, height: size.height, unit: 'pt' },
    blocks: slide.blocks,
  }) as SlideSchemaSlide;
}

function normalizeSlide(value: unknown, index: number, usedIds: Set<string>): SlideSchemaSlide {
  const slide = plainObject(value) ?? { agentOutput: value };
  const candidateId = typeof slide.id === 'string' && slide.id.trim() ? slide.id : '';
  let id = candidateId;
  if (!id || usedIds.has(id)) {
    id = `slide-${String(index + 1).padStart(2, '0')}`;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `slide-${String(index + 1).padStart(2, '0')}-${suffix}`;
      suffix += 1;
    }
  }
  usedIds.add(id);

  const size = plainObject(slide.size);
  const normalizedSize = size
    && size.width === 960
    && size.height === 540
    && size.unit === 'pt'
    ? size
    : { width: 960, height: 540, unit: 'pt' };

  return cloneDeckValue({
    ...slide,
    id,
    size: normalizedSize,
    blocks: Array.isArray(slide.blocks) ? slide.blocks : [],
  }) as SlideSchemaSlide;
}

function objectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function plainObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function sessionAssetPathPrefix(sessionId: string) {
  const id = sessionId.trim();
  if (!id) throw new Error('Schema Deck sessionId is required.');
  return `/api/sessions/${encodeURIComponent(id)}/presentation-assets/`;
}

function sameOriginPath(value: string) {
  if (value.startsWith('/')) return value;
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin && !url.search && !url.hash
      ? url.pathname
      : null;
  } catch {
    return null;
  }
}

export function mapDeckStrings<T>(value: T, transform: (value: string) => string): T {
  if (typeof value === 'string') return transform(value) as T;
  if (Array.isArray(value)) {
    return value.map((item) => mapDeckStrings(item, transform)) as T;
  }
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, mapDeckStrings(item, transform)]),
  ) as T;
}
