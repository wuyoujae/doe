import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readSpeakerNote, saveSpeakerNote, type SpeakerNote } from '@yrkie/application/features/presentation/services/presentationPlaybackService.ts';
import { WebApiRequestError } from '@yrkie/application/services/platform/webApi.ts';
import '../speaker-notes/index.css';

type Draft = { base: SpeakerNote; text: string; saving?: boolean; error?: boolean; saved?: boolean; conflict?: SpeakerNote };
type Props = { link: string; epoch: string; slideId: string; fallback: string; isOwner: boolean };
const dirty = (draft: Draft) => draft.text !== draft.base.content;
export function SpeakerNotesEditor({ link, epoch, slideId, fallback, isOwner }: Props) {
  const { t } = useTranslation('presentation');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const current = useRef(drafts); const alive = useRef(true);
  const revoked = useRef(false); const compositionTimer = useRef<ReturnType<typeof setTimeout>>();
  const [denied, setDenied] = useState(false); const [loadFailed, setLoadFailed] = useState(false);
  // Pin the field during IME composition so its final input cannot land on another slide.
  const [composingSlide, setComposingSlide] = useState<string | null>(null);
  const id = composingSlide || slideId;
  const update = useCallback((key: string, change: (value: Draft | undefined) => Draft) => {
    if (!alive.current || revoked.current) return;
    current.current = { ...current.current, [key]: change(current.current[key]) }; setDrafts(current.current);
  }, []);
  const revoke = useCallback(() => { revoked.current = true; current.current = {}; setDrafts({}); setDenied(true); }, []);
  const authorizationError = (error: unknown) => error instanceof WebApiRequestError && [401, 403, 404, 410].includes(error.status);
  useEffect(() => { alive.current = true; return () => { alive.current = false; clearTimeout(compositionTimer.current); }; }, []);
  useEffect(() => {
    const abort = new AbortController(); let pending = false;
    const refresh = async () => {
      if (pending || document.hidden || denied) return;
      pending = true;
      try {
        const note = await readSpeakerNote(link, id, abort.signal);
        if (abort.signal.aborted) return;
        if (isOwner && !note.canEdit) { revoke(); return; }
        setLoadFailed(false);
        update(id, value => {
          if (!value) return { base: note, text: note.content };
          if (value.saving || note.revision < value.base.revision) return value;
          if (!dirty(value)) return { ...value, base: note, text: note.content, conflict: undefined };
          return note.revision !== value.base.revision ? { ...value, conflict: note } : value;
        });
      } catch (error) {
        if (!abort.signal.aborted) { if (authorizationError(error)) revoke(); else setLoadFailed(true); }
      } finally { pending = false; }
    };
    void refresh(); const timer = setInterval(() => void refresh(), 2000);
    document.addEventListener('visibilitychange', refresh); window.addEventListener('focus', refresh);
    return () => { abort.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh); };
  }, [link, id, update, revoke, denied, isOwner]);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => {
      if (Object.values(current.current).some(value => dirty(value) || value.saving)) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', leave); return () => window.removeEventListener('beforeunload', leave);
  }, []);
  const save = async () => {
    const submitted = current.current[id];
    if (!isOwner || denied || !submitted?.base.canEdit || submitted.saving || submitted.conflict || composingSlide) return;
    if (new TextEncoder().encode(submitted.text).length > 60000) return;
    update(id, value => ({ ...value!, saving: true, error: false, saved: false }));
    try {
      const note = await saveSpeakerNote(link, id, submitted.text, submitted.base.revision, epoch);
      if (!alive.current) return;
      update(id, value => ({ ...value!, base: note, saving: false, saved: value!.text === submitted.text }));
    } catch (error) {
      if (!alive.current) return;
      if (authorizationError(error)) { revoke(); return; }
      update(id, value => ({ ...value!, saving: false, error: true }));
      if (error instanceof WebApiRequestError && error.status === 409) {
        try {
          const note = await readSpeakerNote(link, id);
          update(id, value => ({ ...value!, conflict: note }));
        } catch (refreshError) { if (alive.current && authorizationError(refreshError)) revoke(); }
      }
    }
  };
  const entry = drafts[id]; const editable = isOwner && !!entry?.base.canEdit && !denied;
  const tooLong = !!entry && new TextEncoder().encode(entry.text).length > 60000;
  const unsaved = Object.values(drafts).some(dirty);
  if (denied) return <div className="live-notes" role="status">{t('noteEditor.denied')}</div>;
  return <section className="speaker-notes-editor" aria-label={t('notes')}>
    {isOwner ? <textarea className="speaker-notes-input" aria-label={t('notes')} value={entry?.text ?? fallback} readOnly={!editable}
      onCompositionStart={() => { clearTimeout(compositionTimer.current); setComposingSlide(id); }}
      onCompositionEnd={event => {
        const text = event.currentTarget.value;
        if (editable) update(id, value => ({ ...value!, text, saved: false }));
        // Some browsers emit the final input after compositionend in the same task.
        compositionTimer.current = setTimeout(() => { if (alive.current) setComposingSlide(null); }, 0);
      }}
      onChange={event => { const text = event.target.value; if (editable) update(id, value => ({ ...value!, text, saved: false, error: false })); }}
      onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void save(); } }}
      placeholder={t('noNotes')} /> : <div className="live-notes">{entry?.text ?? (fallback || t('noNotes'))}</div>}
    {entry?.base.sourceChanged && <p>{t('noteEditor.sourceChanged')}</p>}
    {entry?.conflict && <div className="speaker-notes-conflict" role="alert"><p>{t('noteEditor.conflict')}</p><pre>{entry.conflict.content || t('noNotes')}</pre>
      <button onClick={() => update(id, value => ({ base: value!.conflict!, text: value!.conflict!.content }))}>{t('noteEditor.useLatest')}</button>
      <button onClick={() => update(id, value => ({ ...value!, base: value!.conflict!, conflict: undefined, error: false }))}>{t('noteEditor.keepDraft')}</button>
    </div>}
    <div className="speaker-notes-actions"><span role="status" aria-live="polite">{t(tooLong ? 'noteEditor.tooLong' : loadFailed || entry?.error ? 'noteEditor.failed' : entry?.saving ? 'noteEditor.saving' : unsaved ? 'noteEditor.unsaved' : entry?.saved ? 'noteEditor.saved' : !entry ? 'loading' : isOwner ? 'noteEditor.ready' : 'noteEditor.readonly')}</span>
      {isOwner && <button disabled={!editable || !entry || (!dirty(entry) && !entry.base.sourceChanged) || !!entry.saving || !!entry.conflict || tooLong || !!composingSlide} onClick={() => void save()}>{t('noteEditor.save')}</button>}
    </div>
  </section>;
}
