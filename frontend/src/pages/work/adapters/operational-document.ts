import { isServerProject, projectRequest } from '../../../lib/generation';
import { imagePath } from '../../../lib/project-images';
import { readProject } from '../../../lib/projects';

export async function prepareOperationalDocument(projectId: string, sourceRevision: number): Promise<{ projectId: string; revision: number }> {
  if (isServerProject(projectId)) return { projectId, revision: sourceRevision };
  const project = await readProject(projectId);
  if (!project || project.schemaDeck.revision !== sourceRevision) throw new Error('文稿已变化，请保存后重试。');
  const ids = new Set<string>();
  const visit = (value: unknown) => {
    if (typeof value === 'string' && /^yrkie-asset-data:\/\/[a-f0-9]{64}$/.test(value)) ids.add(value.slice(19));
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(project.schemaDeck.deck);
  const assets: Array<{ assetId: string; base64: string }> = [];
  let total = 0;
  for (const assetId of [...ids].sort()) {
    const response = await fetch(imagePath(projectId, assetId));
    if (!response.ok) throw new Error('无法读取文稿图片，请重新打开文稿后重试。');
    const blob = await response.blob();
    total += blob.size;
    if (total > 64 * 1024 * 1024) throw new Error('文稿图片超过 64 MB，请减少图片后重试。');
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('无法读取文稿图片。'));
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.readAsDataURL(blob);
    });
    assets.push({ assetId, base64 });
  }
  return projectRequest('/api/v1/browser-document-snapshots', { method: 'POST', body: JSON.stringify({
    sourceId: projectId, sourceRevision, prompt: project.prompt || project.title || 'Presentation', deck: project.schemaDeck.deck, assets,
  }) });
}
