export type PresentationPreparationResult = {
  slideDeckFormat: 'legacy' | 'schema-v4';
  sourceRevision?: number;
};

type PresentationPreparer = () => Promise<PresentationPreparationResult | void>;

const preparers = new Map<string, PresentationPreparer>();

export function registerPresentationPreparer(sessionId: string, prepare: PresentationPreparer) {
  const id = sessionId.trim();
  if (!id) return () => undefined;
  preparers.set(id, prepare);
  return () => {
    if (preparers.get(id) === prepare) preparers.delete(id);
  };
}

export async function preparePresentationForPlayback(sessionId: string) {
  return preparers.get(sessionId.trim())?.();
}
