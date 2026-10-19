import { openProjectDatabase, transactionFinished } from '../../../lib/projects';

export type SchemaDeckLayoutIssue = 'safe-area-overflow' | 'final-paint-overflow' | 'locked-bleed-overflow';

export async function reportSessionSchemaDeckLayoutWarning(projectId: string, warning: {
  expectedRevision: number; slideIndex: number; layoutIssue: SchemaDeckLayoutIssue; overflowX: number; overflowY: number;
}) {
  const db = await openProjectDatabase();
  const transaction = db.transaction('layoutWarnings', 'readwrite');
  const finished = transactionFinished(transaction);
  transaction.objectStore('layoutWarnings').add({ projectId, ...warning, createdAt: new Date().toISOString() });
  await finished;
}
