import { projectPath, projectRequest, type ProjectSnapshot } from '../../../lib/generation';
import type { SessionOutlineRecord, WorkOutlineCard } from '../components/generation/outline/WorkOutlinePreview';

/** Keep storage revisions and stable page identities out of the original view component. */
export function toOutlineRecord(project: ProjectSnapshot): SessionOutlineRecord | null {
  if (!project.outline) return null;
  const document = project.outline.document as { title: string; page_count: number; body: SessionOutlineRecord['body'] };
  return { outlineId: project.id, sessionId: project.id, title: document.title,
    page_count: document.page_count, body: document.body, revision: project.revision };
}

export function saveOutline(project: ProjectSnapshot, cards: WorkOutlineCard[], expectedRevision: number) {
  const document = {
    title: (project.outline?.document as { title?: string } | undefined)?.title || project.title,
    page_count: cards.length,
    body: cards.map((card, index) => ({ id: card.id, index: index + 1, page: index + 1, contents: card.contents })),
  };
  return projectRequest<ProjectSnapshot>(`${projectPath(project.id)}/outline`, {
    method: 'PUT', body: JSON.stringify({ expectedRevision, document }),
  });
}
