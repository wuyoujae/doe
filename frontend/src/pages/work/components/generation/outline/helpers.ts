import type { WorkOutlineCard, SessionOutlineRecord } from './types';

const DOE_OUTLINE_IMAGE_RATIOS = new Set(['1:1', '4:3', '3:4', '4:5', '16:9', '9:16']);
const DOE_OUTLINE_IMAGE_ASSET_PATTERN = /^yrkie-asset-data:\/\/[A-Za-z0-9_-]+$/;

export function moveOutlineCardToIndex(cards: WorkOutlineCard[], draggedId: string, targetIndex: number) {
  const draggedIndex = cards.findIndex((item) => item.id === draggedId);

  if (draggedIndex < 0) {
    return cards;
  }

  const draggedCard = cards[draggedIndex];
  const remainingCards = cards.filter((item) => item.id !== draggedId);
  const insertIndex = Math.min(Math.max(targetIndex, 0), remainingCards.length);

  return [
    ...remainingCards.slice(0, insertIndex),
    draggedCard,
    ...remainingCards.slice(insertIndex),
  ];
}

export function areOutlineCardsEqual(left: WorkOutlineCard[], right: WorkOutlineCard[]) {
  if (left.length !== right.length) return false;

  return left.every((card, index) => {
    const other = right[index];
    return Boolean(other)
      && card.id === other.id
      && card.page === other.page
      && card.title === other.title
      && card.content === other.content
      && card.contents.length === other.contents.length
      && card.contents.every((content, contentIndex) => content === other.contents[contentIndex]);
  });
}

function outlineContentsToText(contents: string[]) {
  return contents.map((item) => item.trim()).filter(Boolean).join('\n');
}

const DOE_OUTLINE_IMAGE_MARKER_NAME = 'generateimg';
const DOE_OUTLINE_IMAGE_MARKER_MAX_DISTANCE = 2;

function hasBoundedEditDistance(left: string, right: string, limit: number) {
  if (Math.abs(left.length - right.length) > limit) return false;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  let current = new Array<number>(right.length + 1).fill(0);
  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    current[0] = leftIndex + 1;
    let rowMinimum = current[0];
    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      current[rightIndex + 1] = Math.min(
        previous[rightIndex] + Number(left[leftIndex] !== right[rightIndex]),
        current[rightIndex] + 1,
        previous[rightIndex + 1] + 1,
      );
      rowMinimum = Math.min(rowMinimum, current[rightIndex + 1]);
    }
    if (rowMinimum > limit) return false;
    [previous, current] = [current, previous];
  }
  return previous[right.length] <= limit;
}

function canonicalDoeOutlineImageMarker(content: string) {
  const marker = /^([A-Za-z_-]+)(?=[[(])/.exec(content);
  if (!marker) return null;
  const normalizedName = marker[1].replaceAll(/[_-]/g, '').toLowerCase();
  if (!hasBoundedEditDistance(
    normalizedName,
    DOE_OUTLINE_IMAGE_MARKER_NAME,
    DOE_OUTLINE_IMAGE_MARKER_MAX_DISTANCE,
  )) return null;
  return `GENRATEIMG${content.slice(marker[1].length)}`;
}

function isDoeOutlineImagePlaceholder(content: string) {
  const value = content.trim();
  const canonical = canonicalDoeOutlineImageMarker(value);
  if (!canonical) return false;
  const legacyPrefix = 'GENRATEIMG(';
  if (canonical.startsWith(legacyPrefix)) {
    return canonical.endsWith(')')
      && canonical.slice(legacyPrefix.length, -1).trim().length > 0;
  }

  const typed = /^GENRATEIMG\[type=(content|decorative),ratio=([^\]]+)\]\(([\s\S]*)\)$/.exec(canonical);
  if (typed) {
    return DOE_OUTLINE_IMAGE_RATIOS.has(typed[2]) && Boolean(typed[3].trim());
  }

  const configured = /^GENRATEIMG\[ratio=([^\]]+)\]\(([\s\S]*)\)$/.exec(canonical);
  return Boolean(
    configured
      && DOE_OUTLINE_IMAGE_RATIOS.has(configured[1])
      && configured[2].trim(),
  );
}

export function isDoeOutlineImageReference(content: string) {
  const value = content.trim();
  return isDoeOutlineImagePlaceholder(value) || DOE_OUTLINE_IMAGE_ASSET_PATTERN.test(value);
}

export function visibleOutlineContents(contents: string[], hideDoeImageReferences: boolean) {
  return hideDoeImageReferences
    ? contents.filter((content) => !isDoeOutlineImageReference(content))
    : contents;
}

function normalizeOutlineContents(contents: unknown) {
  if (!Array.isArray(contents)) {
    return [];
  }

  return contents
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sessionOutlineToCards(
  outline: SessionOutlineRecord,
  slideLabel: string,
  hideDoeImageReferences = false,
): WorkOutlineCard[] {
  if (outline.body?.length) {
    return [...outline.body]
      .filter((slide) => slide && typeof slide.index === 'number')
      .sort((a, b) => a.index - b.index)
      .map((slide) => {
        const contents = normalizeOutlineContents(slide.contents);
        const displayContents = visibleOutlineContents(contents, hideDoeImageReferences);
        const page = Number.isFinite(slide.page) && slide.page > 0 ? slide.page : slide.index;
        return {
          id: slide.id || `outline-slide-${slide.index}`,
          page,
          title: displayContents[0] ?? `${slideLabel} ${String(page).padStart(2, '0')}`,
          content: outlineContentsToText(displayContents.slice(1)),
          contents: contents.length ? contents : [`${slideLabel} ${slide.index}`],
        };
      });
  }

  return [...(outline.cards ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((card, index) => {
      const title = typeof card.title === 'string' && card.title.trim()
        ? card.title.trim()
        : `${slideLabel} ${String(index + 1).padStart(2, '0')}`;
      const content = typeof card.content === 'string' ? card.content.trim() : '';

      return {
        id: typeof card.id === 'string' && card.id.trim() ? card.id : `outline-card-${index + 1}`,
        page: index + 1,
        title,
        content,
        contents: content ? [content] : [title],
      };
    });
}

