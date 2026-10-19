import { ArrowUp, Check, ImagePlus, LoaderCircle, RefreshCw, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@yrkie/application/components/ui/Select.tsx';
import { Checkbox } from '@yrkie/application/components/ui/Checkbox.tsx';
import { WebApiRequestError } from '@yrkie/application/services/platform/webApi.ts';
import { generateImage, imagePath, imageRatios, listImageJobs, listImages, mergeImages, nearestRatio, ratioValue, supportsImageGeneration, uploadImage, type GenerateInput, type ImageJob, type ImageRatio, type ProjectImage } from '../service/index.ts';
import '../images/index.css';

type Pending = ImageJob & { file?: File; input?: GenerateInput; aspect?: number; sending?: boolean; networkError?: boolean };
type Props = { sessionId: string; selected: string; initialRatio: number; onSelect: (image: ProjectImage) => void };
function errorKey(code: string) {
  if (code === 'project_image_insufficient_credits') return 'images.credits';
  if (code === 'project_image_busy' || code === 'project_image_rate_limited') return 'images.busy';
  if (code === 'project_image_invalid_file') return 'images.invalidFile';
  if (code === 'project_image_storage_unavailable') return 'images.storage';
  if (code.startsWith('content_image_') || code.includes('matting')) return 'images.matting';
  return 'images.failed';
}

export function ImagePicker({ sessionId, selected, initialRatio, onSelect }: Props) {
  const { t } = useTranslation('doeEditor');
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState<ImageRatio>(nearestRatio(initialRatio));
  const [removeBackground, setRemoveBackground] = useState(false);
  const canGenerate = supportsImageGeneration(sessionId);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const alive = useRef(true);
  const pendingRef = useRef(pending); pendingRef.current = pending;
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const draggingCount = useRef(0);
  const dismissed = useRef(new Set<string>());
  const paged = useRef(false);

  useLayoutEffect(() => {
    const input = promptInput.current!;
    const resize = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight / rem}rem`;
    };
    resize();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(input.parentElement!);
    return () => observer?.disconnect();
  }, [prompt]);

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    let timer = 0; let refreshing = false; let first = true;
    async function refresh() {
      if (refreshing || controller.signal.aborted) return;
      refreshing = true;
      try {
        const [page, jobs] = await Promise.all([listImages(sessionId, null, controller.signal), listImageJobs(sessionId, controller.signal)]);
        if (controller.signal.aborted) return;
        setImages(current => mergeImages(current, page.images));
        if (first || !paged.current) setCursor(page.nextCursor);
        first = false;
        setPending(current => {
          const known = new Map(current.map(item => [item.requestId, item]));
          jobs.jobs.forEach(job => {
            if (job.state !== 'succeeded' || known.has(job.requestId)) known.set(job.requestId, { ...known.get(job.requestId), ...job, sending: false, networkError: false });
          });
          return [...known.values()].filter(job => !dismissed.current.has(job.requestId));
        });
        setError('');
      } catch (reason) {
        if (!controller.signal.aborted) setError(t('images.loadFailed'));
      } finally {
        refreshing = false;
        if (!controller.signal.aborted) { setLoading(false); clearTimeout(timer); timer = window.setTimeout(refresh, 3000); }
      }
    }
    refreshRef.current = refresh;
    void refresh();
    return () => { alive.current = false; controller.abort(); clearTimeout(timer); };
  }, [sessionId, t]);

  async function send(item: Pending) {
    setPending(current => [item, ...current.filter(job => job.requestId !== item.requestId)]);
    try {
      const job = item.file ? await uploadImage(sessionId, item.requestId, item.file) : await generateImage(sessionId, item.input!);
      if (!alive.current) return;
      setPending(current => current.map(existing => existing.requestId === item.requestId ? { ...existing, ...job, sending: false } : existing));
      void refreshRef.current();
    } catch (reason) {
      if (!alive.current) return;
      const definitive = reason instanceof WebApiRequestError && reason.status >= 400 && reason.status < 500;
      setPending(current => current.map(existing => existing.requestId === item.requestId ? { ...existing, sending: false, state: 'failed', networkError: !definitive, errorCode: reason instanceof WebApiRequestError ? reason.code || '' : '' } : existing));
    }
  }
  async function upload(file: File) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 20 * 1024 * 1024) { setError(t('images.invalidFile')); return; }
    if (pendingRef.current.filter(job => job.sending || ['queued', 'processing'].includes(job.state)).length >= 2) { setError(t('images.busy')); return; }
    const requestId = crypto.randomUUID();
    const item: Pending = { requestId, kind: 'upload', state: 'queued', ratio: '1:1', assetId: null, errorCode: '', createdAt: new Date().toISOString(), file, sending: true };
    // Insert immediately; decode only the local header/pixels to refine its shape.
    void send(item);
    try {
      const bitmap = await createImageBitmap(file);
      const aspect = bitmap.width / bitmap.height; bitmap.close();
      if (alive.current) setPending(current => current.map(job => job.requestId === requestId ? { ...job, aspect } : job));
    } catch { /* The server owns file validation; an initial square is harmless. */ }
  }
  function generate() {
    if (!canGenerate || !prompt.trim()) return;
    if (pendingRef.current.some(job => job.sending || ['queued', 'processing'].includes(job.state))) { setError(t('images.busy')); return; }
    const requestId = crypto.randomUUID();
    const input = { requestId, prompt: prompt.trim(), ratio, removeBackground };
    void send({ requestId, kind: 'generate', state: 'queued', ratio, assetId: null, errorCode: '', createdAt: new Date().toISOString(), input, sending: true });
  }
  async function more() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try { const page = await listImages(sessionId, cursor); if (alive.current) { paged.current = true; setImages(current => mergeImages(current, page.images)); setCursor(page.nextCursor); } }
    catch { if (alive.current) setError(t('images.loadFailed')); }
    finally { if (alive.current) setLoadingMore(false); }
  }
  function retry(item: Pending) {
    if (!item.file && !item.input) { setError(t('images.retryInput')); return; }
    // Ambiguous HTTP outcomes replay the same key; a confirmed failed execution is a new explicit request.
    const id = item.networkError ? item.requestId : crypto.randomUUID();
    if (id !== item.requestId) { dismissed.current.add(item.requestId); setPending(current => current.filter(job => job.requestId !== item.requestId)); }
    void send({ ...item, requestId: id, input: item.input ? { ...item.input, requestId: id } : undefined, state: 'queued', sending: true, networkError: false, errorCode: '' });
  }
  const completed = new Map(pending.filter(job => job.state === 'succeeded').map(job => [job.assetId, images.find(image => image.assetId === job.assetId)]));
  return <div className="doe-image-picker">
    <input ref={fileInput} className="doe-image-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file); }} />
    <button type="button" className="doe-image-drop" data-dragging={dragging || undefined} onClick={() => fileInput.current?.click()}
      onDragEnter={event => { event.preventDefault(); draggingCount.current++; setDragging(true); }}
      onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
      onDragLeave={event => { event.preventDefault(); if (--draggingCount.current <= 0) setDragging(false); }}
      onDrop={event => { event.preventDefault(); draggingCount.current = 0; setDragging(false); if (event.dataTransfer.files.length !== 1) { setError(t('images.oneFile')); return; } void upload(event.dataTransfer.files[0]); }}>
      {/* i18n-ignore: format names and the upload limit are shared technical labels. */}
      <ImagePlus aria-hidden="true" /><span>{t('images.drop')}</span><small>PNG · JPEG · WebP · 20 MB</small>
    </button>
    {/* i18n-ignore: the user explicitly requested the literal separator "or". */}
    <div className="doe-image-divider" aria-hidden="true"><span>or</span></div>
    <div className="doe-image-composer">
      <textarea ref={promptInput} rows={1} disabled={!canGenerate} aria-label={t('images.prompt')} placeholder={t('images.prompt')} value={prompt} maxLength={16000} onChange={event => setPrompt(event.target.value)} />
      <div className="doe-image-toolbar">
        <label className="doe-image-matting"><Checkbox disabled={!canGenerate} checked={removeBackground} onChange={event => setRemoveBackground(event.target.checked)} /><span>{t('images.removeBackground')}</span></label>
        <Select disabled={!canGenerate} label={t('images.ratio')} value={ratio} onChange={setRatio} options={imageRatios.map(value => ({ value, label: value }))} />
        <button className="doe-image-send" type="button" aria-label={t('images.generate')} disabled={!canGenerate || !prompt.trim() || pending.some(job => job.sending || ['queued', 'processing'].includes(job.state))} onClick={generate}><ArrowUp aria-hidden="true" /></button>
      </div>
    </div>
    {error && <p className="doe-image-error" role="alert">{error}</p>}
    <div className="doe-image-grid" aria-label={t('images.gallery')}>
      {pending.map((item, index) => {
        const result = item.state === 'succeeded' ? completed.get(item.assetId) : undefined;
        if (result && pending.findIndex(job => job.state === 'succeeded' && job.assetId === item.assetId) !== index) return null;
        if (result) return <ImageTile key={item.requestId} image={result} src={imagePath(sessionId, result.assetId)} selected={selected === imagePath(sessionId, result.assetId) || selected.endsWith(result.assetId)} onSelect={() => onSelect(result)} />;
        return <div className="doe-image-item doe-image-pending" key={item.requestId} style={{ aspectRatio: item.aspect || ratioValue(item.ratio) }} aria-busy={['queued', 'processing', 'succeeded'].includes(item.state)}>
        {['queued', 'processing', 'succeeded'].includes(item.state) ? <><LoaderCircle className="doe-image-spinner" aria-hidden="true" /><span role="status">{t(item.kind === 'upload' ? 'images.uploading' : 'images.generating')}</span></> : <>
          <span role="status">{t(item.state === 'uncertain' ? 'images.uncertain' : item.networkError ? 'images.networkFailed' : errorKey(item.errorCode))}</span>
          {(item.file || item.input) && item.state !== 'uncertain' && <button type="button" onClick={() => retry(item)} aria-label={t('images.retry')}><RefreshCw aria-hidden="true" /></button>}
          <button type="button" onClick={() => { dismissed.current.add(item.requestId); setPending(current => current.filter(job => job.requestId !== item.requestId)); }} aria-label={t('images.dismiss')}><X aria-hidden="true" /></button>
        </>}
      </div>; })}
      {images.filter(item => !completed.has(item.assetId)).map(item => <ImageTile key={item.assetId} image={item} src={imagePath(sessionId, item.assetId)} selected={selected === imagePath(sessionId, item.assetId) || selected.endsWith(item.assetId)} onSelect={() => onSelect(item)} />)}
    </div>
    {loading && <div className="doe-image-status" role="status"><LoaderCircle className="doe-image-spinner" />{t('images.loading')}</div>}
    {!loading && !images.length && !pending.length && <p className="doe-image-status">{t('images.empty')}</p>}
    {cursor && <button type="button" className="doe-image-more" disabled={loadingMore} onClick={() => void more()}>{t('images.more')}</button>}
  </div>;
}
function ImageTile({ image, src, selected, onSelect }: { image: ProjectImage; src: string; selected: boolean; onSelect: () => void }) {
  const { t } = useTranslation('doeEditor');
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <button type="button" className="doe-image-item doe-image-tile" style={{ aspectRatio: image.width / image.height }} aria-label={t('images.select')} aria-pressed={selected} onClick={() => { if (failed) { setFailed(false); setAttempt(current => current + 1); } else if (loaded) onSelect(); }}>
    <img key={attempt} src={attempt && !src.startsWith('blob:') ? `${src}?retry=${attempt}` : src} alt="" loading="lazy" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
    {failed && <span className="doe-image-tile-state">{t('images.imageFailed')}</span>}
    {!loaded && !failed && <LoaderCircle className="doe-image-spinner doe-image-tile-state" aria-hidden="true" />}
    {selected && <span className="doe-image-selected"><Check aria-hidden="true" /></span>}
  </button>;
}
