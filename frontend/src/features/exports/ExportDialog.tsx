import { Download, FileText, LoaderCircle, Presentation, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '../../components/ui/Checkbox';
import { exportMessages } from './messages';
import type { ExportFormat } from './service';
import './export.css';

export function useExportMessages() {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language;
  return exportMessages[locale as keyof typeof exportMessages] || exportMessages.en;
}

// Original ShareExportDialog export view; platform sharing and billing are outside this local application.
export function ExportDialog({ open, title, busy, onClose, onExport }: {
  open: boolean; title: string; busy: boolean; onClose: () => void; onExport: (format: ExportFormat, fonts: boolean) => void;
}) {
  const text = useExportMessages();
  const [fonts, setFonts] = useState(true);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButton.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const dialog = closeButton.current?.closest('[role="dialog"]');
        const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]') || []);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('keydown', keydown); active?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  const start = (format: ExportFormat) => { onExport(format, fonts); onClose(); };
  return createPortal(<div className="work-share-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="work-share-dialog" role="dialog" aria-modal="true" aria-labelledby="work-export-dialog-title">
      <header className="work-share-dialog-header">
        <div><h2 id="work-export-dialog-title">{text.export}</h2><p>{title || text.untitled}</p></div>
        <button ref={closeButton} className="work-share-close" aria-label={text.close} type="button" onClick={onClose}><X /></button>
      </header>
      <div className="work-share-dialog-body">
        <nav className="work-share-tabs" aria-label={text.tabsAria}><button className="active" aria-current="page" type="button"><Download /><span>{text.export}</span></button></nav>
        <div className="work-share-content"><div className="work-export-panel">
          <div className="work-export-heading"><h3>{text.exportTitle}</h3><p>{text.exportDescription}</p></div>
          <ExportOption accent="pdf" description={text.pdfDescription} icon={<FileText />} label={text.pdfLabel} disabled={busy} onClick={() => start('pdf')} />
          <ExportOption accent="pptx" description={text.powerPointDescription} icon={<Presentation />} label={text.powerPointLabel} disabled={busy} onClick={() => start('pptx')} />
          <div className="work-export-fonts"><label><Checkbox checked={fonts} disabled={busy} aria-describedby="work-export-fonts-description" onChange={event => setFonts(event.target.checked)} /><span>{text.embedFontsLabel}</span></label><p id="work-export-fonts-description">{text.embedFontsDescription}</p></div>
        </div></div>
      </div>
    </section>
  </div>, document.querySelector('.work-shell') || document.body);
}
function ExportOption({ accent, description, icon, label, disabled, loading = false, onClick }: {
  accent: 'pdf' | 'pptx'; description: string; icon: ReactNode; label: string; disabled: boolean; loading?: boolean; onClick: () => void;
}) {
  return <button aria-busy={loading} className="work-export-option" disabled={disabled || loading} type="button" onClick={onClick}>
    <span className={`work-export-option-icon ${accent}`}>{icon}</span><span className="work-export-option-copy"><strong>{label}</strong><small>{description}</small></span>
    <span className="work-export-download" aria-hidden="true">{loading ? <LoaderCircle className="work-export-loader" /> : <Download />}</span>
  </button>;
}
