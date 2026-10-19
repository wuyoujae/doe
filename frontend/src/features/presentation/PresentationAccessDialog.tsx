import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, ExternalLink, Monitor, Play, Presentation, X } from 'lucide-react';
import { preparePresentationForPlayback } from './services/presentationPlaybackBridge';
import { playbackSettings, savePlaybackAccess, startPlayback, type PlaybackSettings, type PlaybackScope } from './services/presentationPlaybackService';
import { Select } from '../../components/ui/Select';
import { PrimaryButton } from './components/PrimaryButton';
import '../exports/export.css';
import './styles/access-shell.css';
import '@yrkie/doe/packages/doe-document/src/document/presentation/live/access-dialog/index.css';

export function PresentationAccessDialog({ sessionId, title, onClose }: { sessionId: string; title: string; onClose: () => void }) {
  const { t } = useTranslation('presentation');
  const [value, setValue] = useState<PlaybackSettings | null>(null); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(''); const [opened, setOpened] = useState(false); const [dirty, setDirty] = useState(false);
  const dialog = useRef<HTMLDivElement>(null); const alive = useRef(true);
  useEffect(() => {
    alive.current = true; let disposed = false;
    const focus = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    void playbackSettings(sessionId).then(v => { if (!disposed) setValue(v); }, () => { if (!disposed) setMessage(t('failed')); });
    return () => { disposed = true; alive.current = false; focus?.focus(); };
  }, [sessionId, t]);
  const url = (role: 'presenter' | 'audience', v = value) => new URL(`/${role === 'presenter' ? 'presenter' : 'present'}/${role === 'presenter' ? v?.presenterLink : v?.audienceLink}`, location.origin).href;
  const update = (role: 'presenter' | 'audience', field: 'access' | 'operate', scope: PlaybackScope) => {
    setValue(v => v && ({ ...v, [role]: { ...v[role], [field]: scope } })); setDirty(true); setMessage('');
  };
  const launch = async () => {
    if (!value || busy) return;
    // Reserve both pages during the click gesture; the browser may permit only one.
    const presenter = window.open('about:blank', '_blank'); const audience = window.open('about:blank', '_blank');
    if (presenter) presenter.opener = null; if (audience) audience.opener = null;
    setBusy(true); setMessage('');
    try {
      const prepared = await preparePresentationForPlayback(sessionId);
      if (prepared?.slideDeckFormat !== 'schema-v4' || !prepared.sourceRevision) throw new Error('Playback preparation failed');
      const saved = dirty ? await savePlaybackAccess(sessionId, value) : value;
      if (alive.current) { setValue(saved); setDirty(false); }
      const started = await startPlayback(sessionId, prepared.sourceRevision);
      if (presenter && !presenter.closed) presenter.location.replace(url('presenter', started));
      if (audience && !audience.closed) audience.location.replace(url('audience', started));
      if (alive.current) { setValue(started); setOpened(true); setMessage(t(!presenter || !audience ? 'blocked' : 'opened')); }
    } catch { presenter?.close(); audience?.close(); if (alive.current) setMessage(t('failed')); }
    finally { if (alive.current) setBusy(false); }
  };
  const save = async () => {
    if (!value || busy) return; setBusy(true); setMessage('');
    try { setValue(await savePlaybackAccess(sessionId, value)); setDirty(false); setMessage(t('saved')); }
    catch { setMessage(t('saveFailed')); } finally { setBusy(false); }
  };
  return <div className="work-share-overlay live-access-overlay" onClick={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
    <div ref={dialog} className="work-share-dialog live-access-dialog" role="dialog" aria-modal="true" aria-labelledby="live-access-title" onKeyDown={e => {
      if (e.key === 'Escape' && !busy) { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab') {
        const nodes = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), a[href], input:not(:disabled)')];
        const first = nodes[0], last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }}>
      <div className="work-share-dialog-header"><div><h2 id="live-access-title">{t('title')}</h2><p>{title}</p></div><button className="work-share-close" aria-label={t('close')} disabled={busy} onClick={onClose}><X size={18} /></button></div>
      <div className="work-share-content live-access-content"><p>{t('intro')}</p>
        {(['presenter', 'audience'] as const).map(role => <section className="live-access-section" key={role}>
          <div className="work-share-section-heading">{role === 'presenter' ? <Presentation size={21} /> : <Monitor size={21} />}<div><h3>{t(role)}</h3><p>{t(`${role}Hint`)}</p></div></div>
          <div className="live-access-selects">{(['access', 'operate'] as const).map(field => <div className="live-access-field" key={field}><span>{t(field)}</span><Select<PlaybackScope> label={`${t(role)} · ${t(field)}`} disabled value={value?.[role][field] || 'owner'} options={[{ value: 'owner', label: t('localOwner') }]} onChange={scope => update(role, field, scope)} /></div>)}</div>
          {value && <div className="work-share-link-row"><input aria-label={t(`${role}Link`)} readOnly value={url(role)} onFocus={e => e.target.select()} /><button disabled={dirty || busy} aria-label={t('copy')} onClick={() => void navigator.clipboard.writeText(url(role)).then(() => setMessage(t('copied')), () => setMessage(t('copyFailed')))}><Copy size={16} /></button>{opened && <a aria-label={t('open')} href={url(role)} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /></a>}</div>}
          {value?.[role].access === 'owner' && value?.[role].operate === 'public' && <small>{t('restricted')}</small>}
        </section>)}
        <p className="live-access-note">{t('temporary')} {t('frozen')}</p><p role="status" className="live-access-status">{message}</p>
      </div>
      <div className="work-share-footer live-access-footer"><button disabled={busy || !dirty} onClick={() => void save()}>{t('save')}</button><PrimaryButton disabled={busy || !value} onClick={() => void launch()}><Play size={16} />{t(busy ? 'loading' : opened ? 'join' : 'start')}</PrimaryButton></div>
    </div>
  </div>;
}
