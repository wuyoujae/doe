import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BriefcaseBusiness, ChartNoAxesCombined, ChevronRight, GraduationCap, HandCoins, LayoutTemplate, Megaphone, Stethoscope, X } from 'lucide-react';

export const exampleCategories = ['finance', 'consulting', 'sales', 'education', 'healthcare', 'fundraising', 'general'] as const;
type Category = typeof exampleCategories[number];
const icons = { finance: ChartNoAxesCombined, consulting: BriefcaseBusiness, sales: Megaphone, education: GraduationCap, healthcare: Stethoscope, fundraising: HandCoins, general: LayoutTemplate };

export function PromptExamples({ disabled, onPreview, onSelect }: {
  disabled: boolean;
  onPreview: (prompt: string | null) => void;
  onSelect: (prompt: string) => void;
}) {
  const { t, i18n } = useTranslation('createExamples');
  const [category, setCategory] = useState<Category>('finance');
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Category | null>(null);
  const buttons = useRef<Partial<Record<Category, HTMLButtonElement | null>>>({});

  useEffect(() => {
    if (disabled) { setExpanded(false); onPreview(null); }
  }, [disabled, onPreview]);
  useEffect(() => { setExpanded(false); onPreview(null); }, [i18n.language, onPreview]);
  useEffect(() => () => onPreview(null), [onPreview]);
  useEffect(() => {
    if (expanded) panelRef.current?.focus({ preventScroll: true });
    else if (returnFocus.current) {
      buttons.current[returnFocus.current]?.focus({ preventScroll: true });
      returnFocus.current = null;
    }
  }, [expanded, category]);

  const close = () => { returnFocus.current = category; onPreview(null); setExpanded(false); };
  const getPrompt = (index: number) => t('prompt', {
    topic: t(`categories.${category}.examples.${index}`),
    direction: t(`categories.${category}.direction`),
  });
  const restoreFocusedPreview = () => {
    const focused = document.activeElement as HTMLElement | null;
    const index = focused?.dataset.exampleIndex;
    onPreview(expanded && index !== undefined && panelRef.current?.contains(focused) ? getPrompt(Number(index)) : null);
  };
  const Icon = icons[category];
  return <div className="dashboard-prompt-examples" data-expanded={expanded}>
    <p className="dashboard-prompt-example-hint">{t('startHint')}</p>
    <div className="dashboard-prompt-example-reveal" aria-hidden={!expanded} {...{ inert: expanded ? undefined : '' }}>
      <div className="dashboard-prompt-example-clip">
        <div className="dashboard-prompt-example-panel" ref={panelRef} tabIndex={-1}
          role="region" aria-label={t(`categories.${category}.label`)}
          onPointerLeave={restoreFocusedPreview}
          onKeyDown={event => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
          }}>
          <header><span><Icon aria-hidden="true" />{t(`categories.${category}.label`)}</span>
            <button type="button" aria-label={t('close')} onClick={close}><X aria-hidden="true" /></button>
          </header>
          <div className="dashboard-prompt-example-list">
            {[0, 1, 2, 3, 4].map(index => {
              const title = t(`categories.${category}.examples.${index}`);
              const prompt = getPrompt(index);
              return <button key={index} type="button" disabled={disabled} data-example-index={index}
                onPointerEnter={event => {
                  const focused = document.activeElement as HTMLElement | null;
                  if (event.pointerType !== 'touch' && !focused?.hasAttribute('data-example-index')) onPreview(prompt);
                }}
                onPointerMove={event => { if (event.pointerType !== 'touch') onPreview(prompt); }}
                onPointerLeave={restoreFocusedPreview} onFocus={() => onPreview(prompt)} onBlur={() => onPreview(null)}
                onClick={() => { onPreview(null); setExpanded(false); onSelect(prompt); }}>
                <i className="dashboard-task-dot" aria-hidden="true" /><span>{title}</span><ChevronRight aria-hidden="true" className="dashboard-prompt-example-arrow" />
              </button>;
            })}
          </div>
        </div>
      </div>
    </div>
    <div className="dashboard-prompt-example-categories" role="group" aria-label={t('label')}
      aria-hidden={expanded} {...{ inert: expanded ? '' : undefined }}>
      {exampleCategories.map(value => {
        const CategoryIcon = icons[value];
        return <button key={value} ref={element => { buttons.current[value] = element; }} type="button" disabled={disabled}
          aria-expanded={expanded && category === value} onClick={() => { setCategory(value); setExpanded(true); }}>
          <CategoryIcon aria-hidden="true" /><span>{t(`categories.${value}.label`)}</span>
        </button>;
      })}
    </div>
  </div>;
}
