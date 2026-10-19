import { LoaderCircle, RefreshCw, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './outline/outline.css';

export type RegenerateOutlineDialogProps = {
  open: boolean;
  busy: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  error?: string;
};

/** Original WorkPreviewPanel dialog, with the open-source host owning its request. */
export function RegenerateOutlineDialog({ open, busy, value, onChange, onClose, onSubmit, error }: RegenerateOutlineDialogProps) {
  const { t } = useTranslation('work');
  const titleId = useId();
  const dialog = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const sending = useRef(false);
  const mountedRef = useRef(mounted);
  mountedRef.current = mounted;
  const pending = busy || submitting;
  const callbacks = useRef({ onClose, pending, closing });
  callbacks.current = { onClose, pending, closing };

  useEffect(() => {
    if (open) {
      if (!mountedRef.current) {
        previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      setMounted(true);
      setClosing(false);
      setFailed(false);
      return;
    }
    if (!mountedRef.current) return;
    setClosing(true);
    const timer = window.setTimeout(() => setMounted(false), 160);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const focusable = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (!callbacks.current.pending && !callbacks.current.closing) callbacks.current.onClose();
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        dialog.current?.focus({ preventScroll: true });
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) {
        event.preventDefault();
        first.focus();
      }
    };
    const keepFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.current?.contains(event.target)) {
        (focusable()[0] ?? dialog.current)?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', handleKey, true);
    document.addEventListener('focusin', keepFocus);
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.removeEventListener('focusin', keepFocus);
      if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
    };
  }, [mounted]);

  const close = () => {
    if (!pending && !closing) onClose();
  };
  const submit = async () => {
    if (sending.current || pending || closing || !value.trim()) return;
    sending.current = true;
    setSubmitting(true);
    setFailed(false);
    try {
      await onSubmit();
    } catch {
      setFailed(true);
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  };

  if (!mounted) return null;
  return (
    <div
      className={`work-outline-regenerate-backdrop${closing ? ' is-closing' : ''}`}
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={dialog}
        tabIndex={-1}
        className={`work-outline-regenerate-dialog${closing ? ' is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={pending}
      >
        <header>
          <div>
            <h2 id={titleId}>{t('outline.regenerateDialogTitle')}</h2>
            <p>{t('outline.regenerateDialogDescription')}</p>
          </div>
          <button
            type="button"
            aria-label={t('outline.closeRegenerateDialog')}
            disabled={pending}
            onClick={close}
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <textarea
          autoFocus
          rows={5}
          value={value}
          placeholder={t('outline.regeneratePlaceholder')}
          disabled={pending}
          onChange={(event) => onChange(event.target.value)}
        />
        {(error || failed) && <p role="alert">{error || t('outline.regenerateFailed')}</p>}
        <footer>
          <button type="button" disabled={pending} onClick={close}>
            {t('outline.cancel')}
          </button>
          <button
            className="confirm"
            type="button"
            disabled={!value.trim() || pending}
            onClick={() => void submit()}
          >
            {pending ? <LoaderCircle className="is-spinning" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
            {t('outline.confirm')}
          </button>
        </footer>
      </section>
    </div>
  );
}
