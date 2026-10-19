import type { LucideIcon } from 'lucide-react';
import { useRef } from 'react';

type SubTab<Value extends string> = { value: Value; label: string; icon: LucideIcon };

/** The same compact navigation is used by model and DOE configuration. */
export function SettingsSubTabs<Value extends string>({ id, label, value, tabs, onChange }: {
  id: string; label: string; value: Value; tabs: ReadonlyArray<SubTab<Value>>; onChange: (value: Value) => void;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  return <nav className="settings-subtabs" role="tablist" aria-label={label}>
    {tabs.map(({ value: key, label: title, icon: Icon }, index) => <button key={key} type="button" role="tab"
      ref={element => { buttons.current[index] = element; }} id={`${id}-${key}-tab`} aria-controls={`${id}-${key}-panel`}
      aria-selected={value === key} tabIndex={value === key ? 0 : -1} onClick={() => onChange(key)}
      onKeyDown={event => {
        let next: number | undefined;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        onChange(tabs[next].value);
        buttons.current[next]?.focus();
      }}><Icon aria-hidden="true" /><span>{title}</span></button>)}
  </nav>;
}
