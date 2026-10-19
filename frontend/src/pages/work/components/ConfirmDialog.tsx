import { TriangleAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

type ConfirmDialogProps = {
  busy?: boolean;
  cancelLabel?: string | null;
  confirmLabel?: string;
  description: string;
  open: boolean;
  title: string;
  tone?: 'default' | 'warning' | 'danger';
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  busy = false,
  cancelLabel,
  confirmLabel,
  description,
  open,
  title,
  tone = 'default',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');
  const resolvedCancelLabel = cancelLabel === undefined ? t('actions.cancel') : cancelLabel;
  const resolvedConfirmLabel = confirmLabel ?? t('actions.confirm');
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const busyRef = useRef(busy);
  const onCancelRef = useRef(onCancel);

  busyRef.current = busy;
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    confirmButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!busyRef.current) onCancelRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="confirm-dialog-backdrop"
      role="presentation"
      onMouseDown={() => {
        if (!busy) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        aria-describedby="confirm-dialog-desc"
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        aria-busy={busy}
        className={`confirm-dialog confirm-dialog-${tone}`}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="confirm-dialog-icon" aria-hidden="true">
          <TriangleAlert style={{ width: 18, height: 18 }} />
        </div>
        <div className="confirm-dialog-content">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p id="confirm-dialog-desc">{description}</p>
          <div className="confirm-dialog-actions">
            {resolvedCancelLabel !== null ? (
              <button className="confirm-dialog-btn secondary" type="button" disabled={busy} onClick={onCancel}>
                {resolvedCancelLabel}
              </button>
            ) : null}
            <button
              className="confirm-dialog-btn primary"
              disabled={busy}
              type="button"
              ref={confirmButtonRef}
              onClick={onConfirm}
            >
              {resolvedConfirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
