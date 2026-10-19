import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import '@yrkie/doe/packages/doe-canvas/src/ui/controls/style/index.css';
import './Select.css';

type SelectProps<Value extends string> = {
  label: string;
  value: Value;
  options: ReadonlyArray<{ value: Value; label: string }>;
  disabled?: boolean;
  showLabel?: boolean;
  placement?: 'up' | 'down';
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResults?: string;
  onChange: (value: Value) => void;
};

/** Shared single select, based on the Create project picker. */
export function Select<Value extends string>({ label, value, options, disabled = false, showLabel = false, placement = 'down', className = '', searchable = false, searchPlaceholder = 'Search', noResults = 'No results', onChange }: SelectProps<Value>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const items = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));
  const normalizedQuery = query.trim().normalize('NFKC').toLocaleLowerCase();
  const visibleOptions = searchable && normalizedQuery
    ? options.filter(option => `${option.label} ${option.value}`.normalize('NFKC').toLocaleLowerCase().includes(normalizedQuery))
    : options;

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const selected = items.current[selectedIndex];
      if (searchable) search.current?.focus({ preventScroll: true });
      else selected?.focus({ preventScroll: true });
      const scroller = searchable ? list.current : menu.current;
      if (selected && scroller) {
        const top = selected.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
        scroller.scrollTop = Math.max(0, Math.min(top, top + selected.offsetHeight - scroller.clientHeight));
      }
      menu.current?.scrollIntoView?.({ block: 'nearest' });
      // Measure the final, untransformed bounds so the opening animation cannot
      // leave the last row clipped inside a scrollable dialog.
      let ancestor = root.current?.parentElement;
      while (ancestor && menu.current && root.current) {
        if (/(auto|scroll)/.test(getComputedStyle(ancestor).overflowY)) {
          const top = root.current.getBoundingClientRect().top + menu.current.offsetTop;
          const bottom = top + menu.current.offsetHeight;
          const viewportTop = ancestor.getBoundingClientRect().top + ancestor.clientTop;
          const viewportBottom = viewportTop + ancestor.clientHeight;
          ancestor.scrollTop += top < viewportTop ? top - viewportTop : Math.max(0, bottom - viewportBottom);
          break;
        }
        ancestor = ancestor.parentElement;
      }
    });
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('pointerdown', outside); };
  }, [open, selectedIndex, searchable]);

  const close = () => { setOpen(false); trigger.current?.focus(); };
  const show = () => { setQuery(''); setOpen(true); };
  const optionButtons = visibleOptions.map((option, index) => <button key={option.value} type="button" role="option"
    aria-selected={option.value === value} tabIndex={-1} disabled={disabled}
    ref={element => { items.current[index] = element; }}
    onClick={() => { onChange(option.value); close(); }}
    onKeyDown={event => {
      let next: number | undefined;
      if (event.key === 'ArrowDown') next = (index + 1) % visibleOptions.length;
      if (event.key === 'ArrowUp') next = (index - 1 + visibleOptions.length) % visibleOptions.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = visibleOptions.length - 1;
      if (next !== undefined) { event.preventDefault(); items.current[next]?.focus(); }
      else if (searchable && !event.nativeEvent.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey
        && ((event.key.length === 1 && event.key !== ' ') || event.key === 'Backspace')) {
        event.preventDefault();
        setQuery(current => event.key === 'Backspace' ? current.slice(0, -1) : current + event.key);
        search.current?.focus();
      }
    }}>
    <span>{option.label}</span>{option.value === value && <Check aria-hidden="true" />}
  </button>);
  return <div className={`ui-select ${open ? 'is-open' : ''} ${searchable ? 'is-searchable' : ''} ${className}`} data-placement={placement} ref={root}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === 'Tab' && open) setOpen(false);
    }}>
    {showLabel && <span className="ui-select-label">{label}</span>}
    <button type="button" role="combobox" aria-label={label} aria-controls={menuId}
      aria-haspopup="listbox" aria-expanded={open} disabled={disabled} ref={trigger}
      className="ui-select-trigger" onClick={() => { if (open) close(); else show(); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); }
      }}>
      <span>{options[selectedIndex]?.label}</span><ChevronDown aria-hidden="true" className="ui-select-chevron" />
    </button>
    <div id={searchable ? undefined : menuId} ref={menu} role={searchable ? undefined : 'listbox'} aria-label={searchable ? undefined : label} aria-hidden={!open} className="ui-select-menu">
      {searchable ? <>
        <div className="ui-select-search">
          <Search aria-hidden="true" />
          <input ref={search} type="search" role="searchbox" aria-label={searchPlaceholder} aria-controls={menuId}
            placeholder={searchPlaceholder} value={query} tabIndex={open ? 0 : -1} disabled={disabled}
            autoComplete="off" autoCapitalize="none" spellCheck={false} onChange={event => { setQuery(event.target.value); if (list.current) list.current.scrollTop = 0; }}
            onKeyDown={event => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const index = event.key === 'ArrowUp' ? visibleOptions.length - 1 : Math.max(0, visibleOptions.findIndex(option => option.value === value));
                items.current[index]?.focus();
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                if (visibleOptions.length === 1) { onChange(visibleOptions[0].value); close(); }
              }
            }} />
        </div>
        <div id={menuId} ref={list} className="ui-select-options" role="listbox" aria-label={label}>{optionButtons}</div>
        {!visibleOptions.length && <div className="ui-select-empty" role="status">{noResults}</div>}
      </> : optionButtons}
    </div>
  </div>;
}
