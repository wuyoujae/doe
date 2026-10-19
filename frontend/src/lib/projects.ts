import type { SessionSchemaDeck, SlideSchemaDeck } from '../pages/work/adapters/schema-deck';
import { isServerProject, projectPath, projectRequest, readGeneration, type ProjectSummary } from './generation';
import { WebApiRequestError } from '../pages/work/adapters/webApi';

export type LocalProject = {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  schemaDeck: SessionSchemaDeck;
};

let databasePromise: Promise<IDBDatabase> | undefined;
// Keep the exact uncertain write, even if the editor has accumulated newer changes.
const pendingDeckWrites = new Map<string, { callerRevision: number; serverRevision: number; deck: SlideSchemaDeck }>();
const canonicalJson = (value: unknown): string => JSON.stringify(value, (_key, item: unknown) =>
  item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);

async function saveServerDeck(id: string, expectedRevision: number, deck: SlideSchemaDeck): Promise<SessionSchemaDeck> {
  const pending = pendingDeckWrites.get(id);
  let serverRevision = expectedRevision;
  if (pending?.callerRevision === expectedRevision) {
    const latest = (await readGeneration(id)).schemaDeck;
    if (latest?.revision === pending.serverRevision + 1 && canonicalJson(latest.deck) === canonicalJson(pending.deck)) {
      if (canonicalJson(deck) === canonicalJson(pending.deck)) { pendingDeckWrites.delete(id); return latest; }
      serverRevision = latest.revision;
    } else if (latest?.revision === pending.serverRevision) serverRevision = pending.serverRevision;
    else throw new WebApiRequestError(409, 'conflict', '文稿已在其他窗口更新，请保留当前修改，不要覆盖最新版本。');
  }
  const body = JSON.stringify({ expectedRevision: serverRevision, deck });
  const snapshot = JSON.parse(body) as { deck: SlideSchemaDeck };
  pendingDeckWrites.set(id, { callerRevision: expectedRevision, serverRevision, deck: snapshot.deck });
  try {
    const saved = await projectRequest<SessionSchemaDeck>(`${projectPath(id)}/deck`, { method: 'PUT', body });
    pendingDeckWrites.delete(id);
    return saved;
  } catch (error) {
    if (error instanceof WebApiRequestError && error.status < 500) pendingDeckWrites.delete(id);
    throw error;
  }
}

export function openProjectDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('此浏览器无法使用本地项目存储，请允许浏览器存储后重试。'));
      return;
    }
    const request = indexedDB.open('yrkie-open-source', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('projects', { keyPath: 'id' });
      const images = db.createObjectStore('images', { keyPath: ['projectId', 'assetId'] });
      images.createIndex('projectId', 'projectId');
      const jobs = db.createObjectStore('imageJobs', { keyPath: ['projectId', 'requestId'] });
      jobs.createIndex('projectId', 'projectId');
      const warnings = db.createObjectStore('layoutWarnings', { keyPath: 'id', autoIncrement: true });
      warnings.createIndex('projectId', 'projectId');
    };
    request.onerror = () => reject(request.error ?? new Error('无法打开本地项目存储。'));
    request.onblocked = () => reject(new Error('请关闭其他 Yrkie 标签页后重试本地存储升级。'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); databasePromise = undefined; };
      resolve(db);
    };
  }).catch(error => { databasePromise = undefined; throw error; });
  return databasePromise;
}

export function transactionFinished(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('本地保存未完成，原有项目已保留。'));
    transaction.onerror = () => { /* The abort event supplies the final transaction result. */ };
  });
}

export function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('无法读取本地项目。'));
  });
}

export async function readProject(id: string): Promise<LocalProject | null> {
  if (isServerProject(id)) {
    const project = await readGeneration(id);
    if (!project.schemaDeck) return null;
    return { ...project, schemaDeck: project.schemaDeck };
  }
  const db = await openProjectDatabase();
  return (await requestValue<LocalProject | undefined>(db.transaction('projects').objectStore('projects').get(id))) ?? null;
}

export async function listProjects(): Promise<Array<Pick<LocalProject, 'id' | 'title' | 'updatedAt'>>> {
  const local = async () => {
    const db = await openProjectDatabase();
    return requestValue<LocalProject[]>(db.transaction('projects').objectStore('projects').getAll());
  };
  const [server, browser] = await Promise.allSettled([
    projectRequest<{ projects: ProjectSummary[] }>('/api/v1/projects'), local(),
  ]);
  if (server.status === 'rejected' && browser.status === 'rejected') throw server.reason;
  const projects = [...(server.status === 'fulfilled' ? server.value.projects : []), ...(browser.status === 'fulfilled' ? browser.value : [])];
  if (!projects.length && server.status === 'rejected') throw server.reason;
  return projects.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function saveSchemaDeck(id: string, expectedRevision: number, deck: SlideSchemaDeck): Promise<SessionSchemaDeck> {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw new Error('文稿版本无效。');
  if (isServerProject(id)) return saveServerDeck(id, expectedRevision, deck);
  const db = await openProjectDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readwrite');
    const store = transaction.objectStore('projects');
    const request = store.get(id);
    let saved: SessionSchemaDeck | undefined;
    let failure: Error | undefined;
    request.onsuccess = () => {
      const project = request.result as LocalProject | undefined;
      if (!project) { failure = new Error('此本地项目不存在。'); transaction.abort(); return; }
      if (project.schemaDeck.revision !== expectedRevision) {
        failure = new Error('此文稿已在其他窗口更新。请保留当前页面，刷新前先确认未保存的修改。');
        transaction.abort(); return;
      }
      const updatedAt = new Date().toISOString();
      saved = { ...project.schemaDeck, revision: expectedRevision + 1, updatedAt, deck };
      store.put({ ...project, title: deck.deck.title, updatedAt, schemaDeck: saved });
    };
    transaction.oncomplete = () => saved ? resolve(saved) : reject(new Error('本地保存未返回文稿。'));
    transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('本地保存失败，修改仍留在当前页面。'));
    transaction.onerror = () => {};
  });
}
