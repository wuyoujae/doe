import { X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './Dialog.css';

type DialogProps = { id: string; title: string; children: ReactNode; onClose: () => void; className?: string };

/** Modal lifecycle; the owning feature supplies its header and content layout. */
export function Dialog({ id, title, children, onClose, className = '' }: DialogProps) {
  const { t } = useTranslation('common');
  const dialog = useRef<HTMLDialogElement>(null);
  const closeCallback = useRef(onClose);
  closeCallback.current = onClose;
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    element?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    const closeDuration = dialog.current ? Number.parseFloat(getComputedStyle(dialog.current).getPropertyValue('--ui-dialog-close-duration')) : 200;
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : closeDuration || 200;
    const timer = window.setTimeout(() => closeCallback.current(), duration);
    return () => window.clearTimeout(timer);
  }, [closing]);

  return createPortal(<dialog ref={dialog} id={id} data-ui-theme className={`ui-dialog ${className}${closing ? ' is-closing' : ''}`}
    aria-label={title}
    onCancel={event => { event.preventDefault(); setClosing(true); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) setClosing(true);
    }}>
    <button type="button" className="ui-dialog-close" aria-label={t('actions.close')} onClick={() => setClosing(true)}><X aria-hidden="true" /></button>
    <div className="ui-dialog-content">{children}</div>
  </dialog>, document.body);
}
