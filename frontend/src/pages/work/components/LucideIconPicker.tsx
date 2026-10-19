import { LoaderCircle, Search } from 'lucide-react';
import {
  createElement,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  loadLucideIconCatalog,
  lucideDisplayName,
  type LucideIconDefinition,
  type LucideNode,
} from '../adapters/lucideIcons';
import './LucideIconPicker.css';

type IconCategory = 'all' | 'business' | 'arrows' | 'communication' | 'data' | 'files' | 'people' | 'devices' | 'media';

type LucideIconPickerProps = {
  onClose?: () => void;
  onSelect: (icon: LucideIconDefinition) => void;
  isAvailable?: (icon: LucideIconDefinition) => boolean;
};

const ROW_HEIGHT = 72;
const MIN_COLUMN_WIDTH = 68;
const OVERSCAN_ROWS = 2;

const categories: Array<{ id: IconCategory; tokens: string[] }> = [
  { id: 'all', tokens: [] },
  { id: 'business', tokens: ['briefcase', 'building', 'store', 'wallet', 'banknote', 'badge', 'target', 'presentation'] },
  { id: 'arrows', tokens: ['arrow', 'chevron', 'move', 'corner', 'undo', 'redo', 'refresh', 'rotate'] },
  { id: 'communication', tokens: ['message', 'mail', 'phone', 'send', 'bell', 'contact', 'speech', 'radio'] },
  { id: 'data', tokens: ['chart', 'database', 'table', 'activity', 'analytics', 'binary', 'calculator', 'percent'] },
  { id: 'files', tokens: ['file', 'folder', 'clipboard', 'archive', 'book', 'notebook', 'paperclip'] },
  { id: 'people', tokens: ['user', 'users', 'person', 'contact', 'baby', 'accessibility'] },
  { id: 'devices', tokens: ['monitor', 'laptop', 'smartphone', 'tablet', 'computer', 'keyboard', 'mouse', 'printer'] },
  { id: 'media', tokens: ['play', 'pause', 'video', 'camera', 'image', 'music', 'audio', 'volume', 'mic'] },
];

function LucideGlyph({ nodes }: { nodes: LucideNode[] }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
    >
      {nodes.map(([tag, attributes], index) => createElement(tag, { ...attributes, key: `${tag}-${index}` }))}
    </svg>
  );
}

function categoryMatches(icon: LucideIconDefinition, tokens: string[]) {
  if (!tokens.length) return true;
  const searchable = `${icon.name} ${icon.tags.join(' ')}`.toLowerCase();
  return tokens.some((token) => searchable.includes(token));
}

export function LucideIconPicker({ onClose, onSelect, isAvailable }: LucideIconPickerProps) {
  const { t } = useTranslation('editor');
  const [icons, setIcons] = useState<LucideIconDefinition[]>([]);
  const [category, setCategory] = useState<IconCategory>('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadLucideIconCatalog()
      .then((catalog) => {
        if (!cancelled) setIcons(catalog.icons);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    const update = () => setViewport({ width: element.clientWidth, height: element.clientHeight });
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [icons.length, error]);

  useEffect(() => {
    setScrollTop(0);
    setFocusedIndex(0);
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [category, deferredQuery]);

  useEffect(() => {
    if (!onClose) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const activeCategory = categories.find((item) => item.id === category) ?? categories[0];
  const filtered = useMemo(() => icons.filter((icon) => {
    if (isAvailable && !isAvailable(icon)) return false;
    if (!categoryMatches(icon, activeCategory.tokens)) return false;
    if (!deferredQuery) return true;
    return `${icon.name} ${icon.tags.join(' ')}`.toLowerCase().includes(deferredQuery);
  }), [activeCategory.tokens, deferredQuery, icons, isAvailable]);

  const columnCount = Math.max(1, Math.floor(Math.max(MIN_COLUMN_WIDTH, viewport.width) / MIN_COLUMN_WIDTH));
  const rowCount = Math.ceil(filtered.length / columnCount);
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS);
  const endRow = Math.min(rowCount, Math.ceil((scrollTop + viewport.height) / ROW_HEIGHT) + OVERSCAN_ROWS);
  const startIndex = startRow * columnCount;
  const visibleIcons = filtered.slice(startIndex, endRow * columnCount);

  const focusIcon = (requestedIndex: number) => {
    if (!filtered.length) return;
    const nextIndex = Math.max(0, Math.min(filtered.length - 1, requestedIndex));
    const element = viewportRef.current;
    if (!element) return;
    const row = Math.floor(nextIndex / columnCount);
    const rowTop = row * ROW_HEIGHT;
    const rowBottom = rowTop + ROW_HEIGHT;
    let nextScrollTop = element.scrollTop;
    if (rowTop < nextScrollTop) nextScrollTop = rowTop;
    if (rowBottom > nextScrollTop + element.clientHeight) {
      nextScrollTop = rowBottom - element.clientHeight;
    }
    setFocusedIndex(nextIndex);
    setScrollTop(nextScrollTop);
    element.scrollTop = nextScrollTop;
    requestAnimationFrame(() => {
      element.querySelector<HTMLButtonElement>(`[data-lucide-index="${nextIndex}"]`)?.focus();
    });
  };

  const handleGridKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = focusedIndex + 1;
    if (event.key === 'ArrowLeft') nextIndex = focusedIndex - 1;
    if (event.key === 'ArrowDown') nextIndex = focusedIndex + columnCount;
    if (event.key === 'ArrowUp') nextIndex = focusedIndex - columnCount;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = filtered.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    focusIcon(nextIndex);
  };

  return (
    <div className="lucide-picker">
      <label className="lucide-picker-search">
        <Search aria-hidden="true" />
        <span className="sr-only">{t('quick.picker.searchLabel')}</span>
        <input
          autoFocus
          type="search"
          value={query}
          placeholder={t('quick.picker.searchPlaceholder')}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowDown' || !filtered.length) return;
            event.preventDefault();
            focusIcon(0);
          }}
        />
      </label>

      <div className="lucide-picker-categories" role="tablist" aria-label={t('quick.picker.categoriesAria')}>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={category === item.id}
            className={category === item.id ? 'active' : ''}
            onClick={() => setCategory(item.id)}
          >
            {t(`quick.picker.categories.${item.id}`)}
          </button>
        ))}
      </div>

      {error ? (
        <div className="lucide-picker-state" role="alert">{t('quick.picker.loadFailed')}</div>
      ) : !icons.length ? (
        <div className="lucide-picker-state" role="status">
          <LoaderCircle className="lucide-picker-spinner" aria-hidden="true" />
          <span>{t('quick.picker.loading')}</span>
        </div>
      ) : !filtered.length ? (
        <div className="lucide-picker-state">{t('quick.picker.empty')}</div>
      ) : (
        <div
          ref={viewportRef}
          className="lucide-picker-viewport"
          role="listbox"
          aria-label={t('quick.picker.resultsAria')}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          onKeyDown={handleGridKeyDown}
        >
          <div className="lucide-picker-spacer" style={{ height: rowCount * ROW_HEIGHT }}>
            <div
              className="lucide-picker-grid"
              style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                transform: `translateY(${startRow * ROW_HEIGHT}px)`,
              }}
            >
              {visibleIcons.map((icon, visibleIndex) => {
                const label = lucideDisplayName(icon.name);
                const iconIndex = startIndex + visibleIndex;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    role="option"
                    aria-label={label}
                    aria-selected={focusedIndex === iconIndex}
                    data-lucide-index={iconIndex}
                    tabIndex={focusedIndex === iconIndex ? 0 : -1}
                    onFocus={() => setFocusedIndex(iconIndex)}
                    onClick={() => onSelect(icon)}
                  >
                    <LucideGlyph nodes={icon.nodes} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
