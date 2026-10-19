import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './WorkMobileMenu.css';

export function WorkMobileMenu({ title, onBack, onClose, actionsRef }: {
  title: string; onBack: () => void; onClose: () => void; actionsRef: (node: HTMLElement | null) => void;
}) {
  const { t } = useTranslation(['work', 'common']);
  const menu = useRef<HTMLElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = menu.current;
    element?.querySelector<HTMLButtonElement>('button')?.focus();
    // Action buttons are React portals; observe their DOM bubbling on the drawer.
    const action = (event: MouseEvent) => {
      const control = event.target instanceof Element
        ? event.target.closest<HTMLElement>('.work-mobile-menu-actions :is(button,a[href])') : null;
      // The accepted click can already have put an asynchronous action into its busy state.
      if (control) close.current();
    };
    element?.addEventListener('click', action);
    const escape = (event: KeyboardEvent) => {
      if (document.querySelector('.work-share-overlay,dialog[open]')) return;
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key === 'Tab') {
        const controls = menu.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', escape);
    return () => {
      element?.removeEventListener('click', action);
      document.removeEventListener('keydown', escape);
      if (!document.querySelector('.work-share-overlay,dialog[open]')) previous?.focus();
    };
  }, []);
  return <>
    <button className="work-mobile-menu-backdrop" type="button" aria-label={t('common:actions.close')} onClick={onClose} />
    <aside ref={menu} className="work-mobile-menu" aria-label={t('menu')}>
      <div className="work-mobile-menu-head">
        <button className="work-mobile-drawer-back" type="button" aria-label={t('common:actions.back')} onClick={onBack}><ArrowLeft aria-hidden="true" /></button>
        <span className="work-nav-title">{title}</span>
      </div>
      <nav ref={actionsRef} className="work-mobile-menu-actions" aria-label={t('menu')} />
    </aside>
  </>;
}
