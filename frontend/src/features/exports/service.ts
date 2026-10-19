import { projectRequest } from '../../lib/generation';

export type ExportFormat = 'pdf' | 'pptx';
export type ExportJob = {
  jobId: string; projectId: string; format: ExportFormat; status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  sourceRevision: number; fileName: string; downloadUrl: string | null; errorCode: string | null;
};
export type ExportProgress = { phase: 'preparing' | 'creating' | 'queued' | 'generating' | 'downloading' | 'completed'; percent: number };
const key = (projectId: string) => `yrkie.export.${projectId}`;
export function rememberExport(projectId: string, jobId: string | null) {
  try { if (jobId) localStorage.setItem(key(projectId), jobId); else localStorage.removeItem(key(projectId)); } catch { /* The durable server job remains available. */ }
}
export function pendingExport(projectId: string) {
  try { const id = localStorage.getItem(key(projectId)); return id && /^export-[0-9a-f-]{36}$/.test(id) ? id : null; } catch { return null; }
}
export async function createExport(projectId: string, format: ExportFormat, revision: number, embedFonts: boolean, signal: AbortSignal) {
  return projectRequest<ExportJob>(`/api/v1/projects/${encodeURIComponent(projectId)}/exports/${format}`, {
    method: 'POST', body: JSON.stringify({ expectedSourceRevision: revision, embedFonts }), signal,
  });
}
export const readExport = (id: string, signal: AbortSignal) => projectRequest<ExportJob>(`/api/v1/exports/${encodeURIComponent(id)}`, { signal });

// Original bounded polling schedule. Closing or navigating only stops this browser wait.
export async function waitForExport(job: ExportJob, signal: AbortSignal, onProgress: (progress: ExportProgress) => void) {
  const deadline = Date.now() + 20 * 60 * 1000;
  let count = 0;
  while (job.status === 'queued' || job.status === 'running') {
    onProgress({ phase: job.status === 'queued' ? 'queued' : 'generating', percent: job.status === 'queued' ? 30 : 65 });
    if (Date.now() >= deadline) throw new Error('export_still_running');
    const delay = count < 8 ? 750 : count < 30 ? 1500 : 2500;
    await new Promise<void>((resolve, reject) => {
      const done = () => { signal.removeEventListener('abort', abort); resolve(); };
      const timer = setTimeout(done, delay);
      const abort = () => { clearTimeout(timer); reject(signal.reason || new DOMException('Aborted', 'AbortError')); };
      if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
    });
    job = await readExport(job.jobId, signal); count += 1;
  }
  if (job.status !== 'completed' || !job.downloadUrl || !/^\/api\/v1\/exports\/export-[0-9a-f-]{36}\/download$/.test(job.downloadUrl)) {
    throw new Error(job.errorCode || 'export_generation_failed');
  }
  onProgress({ phase: 'downloading', percent: 92 });
  const response = await fetch(job.downloadUrl, { credentials: 'same-origin', cache: 'no-store', signal });
  if (!response.ok) throw new Error('export_download_failed');
  const blob = await response.blob();
  if (!blob.size || blob.size > 128 * 1024 * 1024) throw new Error('export_invalid_file');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = job.fileName; anchor.hidden = true;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  onProgress({ phase: 'completed', percent: 100 });
  return job;
}
