import { openProjectDatabase, requestValue, transactionFinished } from './projects';
import { WebApiRequestError } from '../pages/work/adapters/webApi';
import { isServerProject, projectPath, projectRequest } from './generation';

export const imageRatios = ['1:1', '4:3', '3:4', '4:5', '16:9', '9:16'] as const;
export type ImageRatio = typeof imageRatios[number];
export type ProjectImage = { assetId: string; slideReference: string; width: number; height: number; ratio: string; source: string; createdAt: string };
export type ImageJob = { requestId: string; kind: 'upload' | 'generate' | 'catalog'; state: 'queued' | 'processing' | 'succeeded' | 'failed' | 'uncertain'; ratio: string; assetId: string | null; errorCode: string; createdAt: string };
export type GenerateInput = { requestId: string; prompt: string; ratio: ImageRatio; removeBackground: boolean };
type StoredImage = ProjectImage & { projectId: string; blob: Blob };
type StoredJob = ImageJob & { projectId: string };

const imageUrls = new Map<string, string>();
const references = new Map<string, { projectId: string; assetId: string }>();
const key = (projectId: string, assetId: string) => `${projectId}/${assetId}`;
export const supportsImageGeneration = isServerProject;

function prepareImage(image: StoredImage) {
  const id = key(image.projectId, image.assetId);
  if (!imageUrls.has(id)) {
    const url = URL.createObjectURL(image.blob);
    imageUrls.set(id, url);
    references.set(url, { projectId: image.projectId, assetId: image.assetId });
  }
}

export function imagePath(projectId: string, assetId: string): string {
  if (isServerProject(projectId)) return `${projectPath(projectId)}/assets/${encodeURIComponent(assetId)}`;
  const url = imageUrls.get(key(projectId, assetId));
  if (!url) throw new Error('本地图片不存在，请重新上传该图片。');
  return url;
}

export function canonicalImageReference(projectId: string, value: string): string {
  if (isServerProject(projectId)) {
    try {
      const url = new URL(value, location.origin);
      const prefix = `${projectPath(projectId)}/assets/`;
      if (url.origin === location.origin && url.pathname.startsWith(prefix) && /^[a-f0-9]{64}$/.test(url.pathname.slice(prefix.length))) {
        return `yrkie-asset-data://${url.pathname.slice(prefix.length)}`;
      }
    } catch { /* Non-URL text is not an asset reference. */ }
  }
  const reference = references.get(value);
  return reference?.projectId === projectId ? `yrkie-asset-data://${reference.assetId}` : value;
}

export async function prepareProjectImages(projectId: string): Promise<void> {
  if (isServerProject(projectId)) return;
  const db = await openProjectDatabase();
  const rows = await requestValue<StoredImage[]>(db.transaction('images').objectStore('images').index('projectId').getAll(projectId));
  rows.forEach(prepareImage);
}

export async function listImages(projectId: string, _cursor?: string | null, signal?: AbortSignal): Promise<{ images: ProjectImage[]; nextCursor: string | null }> {
  signal?.throwIfAborted();
  if (isServerProject(projectId)) return projectRequest(`${projectPath(projectId)}/assets`, { signal });
  const db = await openProjectDatabase();
  const rows = await requestValue<StoredImage[]>(db.transaction('images').objectStore('images').index('projectId').getAll(projectId));
  signal?.throwIfAborted();
  rows.forEach(prepareImage);
  return { images: rows.map(({ blob: _blob, projectId: _projectId, ...image }) => image).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), nextCursor: null };
}

export async function listImageJobs(projectId: string, signal?: AbortSignal): Promise<{ jobs: ImageJob[] }> {
  signal?.throwIfAborted();
  if (isServerProject(projectId)) return projectRequest(`${projectPath(projectId)}/image-jobs`, { signal });
  const db = await openProjectDatabase();
  const rows = await requestValue<StoredJob[]>(db.transaction('imageJobs').objectStore('imageJobs').index('projectId').getAll(projectId));
  signal?.throwIfAborted();
  return { jobs: rows.map(({ projectId: _projectId, ...job }) => job) };
}

export async function uploadImage(projectId: string, requestId: string, file: File): Promise<ImageJob> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size === 0 || file.size > 20 * 1024 * 1024) {
    throw new WebApiRequestError(400, 'project_image_invalid_file', '请选择不超过 20 MB 的 PNG、JPEG 或 WebP 图片。');
  }
  if (isServerProject(projectId)) return projectRequest(`${projectPath(projectId)}/assets?requestId=${encodeURIComponent(requestId)}`, {
    method: 'POST', headers: { 'Content-Type': file.type }, body: file,
  });
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new WebApiRequestError(400, 'project_image_invalid_file', '无法读取此图片。'); }
  const { width, height } = bitmap;
  bitmap.close();
  if (!width || !height || width * height > 40_000_000) throw new WebApiRequestError(400, 'project_image_invalid_file', '图片尺寸过大。');
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  const assetId = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const createdAt = new Date().toISOString();
  const image: StoredImage = { projectId, assetId, slideReference: `yrkie-asset-data://${assetId}`, width, height, ratio: nearestRatio(width / height), source: 'upload', createdAt, blob: file };
  const job: ImageJob = { requestId, kind: 'upload', state: 'succeeded', ratio: image.ratio, assetId, errorCode: '', createdAt };
  const db = await openProjectDatabase();
  const transaction = db.transaction(['images', 'imageJobs'], 'readwrite');
  const finished = transactionFinished(transaction);
  transaction.objectStore('images').put(image);
  transaction.objectStore('imageJobs').put({ ...job, projectId });
  try { await finished; }
  catch { throw new WebApiRequestError(507, 'project_image_storage_unavailable', '浏览器本地存储空间不足或不可用。'); }
  prepareImage(image);
  return job;
}

export async function generateImage(projectId: string, input: GenerateInput): Promise<ImageJob> {
  if (isServerProject(projectId)) return projectRequest(`${projectPath(projectId)}/image-jobs`, { method: 'POST', body: JSON.stringify(input) });
  throw new WebApiRequestError(501, 'local_ai_not_connected', '旧版浏览器草稿支持本地图片上传；请从新建页面创建 AI 文稿以使用图片生成。');
}

export function ratioValue(value: string): number {
  const [width, height] = value.split(':').map(Number);
  return width > 0 && height > 0 ? width / height : 1;
}

export function nearestRatio(value: number): ImageRatio {
  return [...imageRatios].sort((a, b) => Math.abs(Math.log(ratioValue(a) / value)) - Math.abs(Math.log(ratioValue(b) / value)))[0];
}

export function mergeImages(current: ProjectImage[], incoming: ProjectImage[]) {
  return [...new Map([...current, ...incoming].map(image => [image.assetId, image])).values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.assetId.localeCompare(a.assetId));
}
