import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { CreatePage, type CreateRequest } from './pages/create/CreatePage';
import { AppHeader } from './components/app-header/AppHeader';
import { isServerProject, startGeneration } from './lib/generation';

const WorkPage = lazy(() => import('./pages/work/WorkPage').then(module => ({ default: module.WorkPage })));
const GenerationWorkPage = lazy(() => import('./pages/work/GenerationWorkPage').then(module => ({ default: module.GenerationWorkPage })));
const PresentationRoute = lazy(() => import('./features/presentation/PresentationRoute').then(module => ({ default: module.PresentationRoute })));

export function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const currentPath = useRef(pathname);
  const leaveGuard = useRef<(() => Promise<boolean>) | null>(null);
  const navigationVersion = useRef(0);
  const pendingCreation = useRef<{ prompt: string; requestId: string } | null>(null);
  const registerLeaveGuard = useCallback((guard: (() => Promise<boolean>) | null) => { leaveGuard.current = guard; }, []);
  useEffect(() => {
    const update = async () => {
      const target = window.location.pathname;
      const previous = currentPath.current;
      const version = ++navigationVersion.current;
      let allowed = true;
      try { if (leaveGuard.current) allowed = await leaveGuard.current(); } catch { allowed = false; }
      if (version !== navigationVersion.current) return;
      if (!allowed) { window.history.pushState(null, '', previous); return; }
      currentPath.current = target;
      setPathname(target);
    };
    window.addEventListener('popstate', update);
    return () => { window.removeEventListener('popstate', update); };
  }, []);
  const navigate = (path: string) => { ++navigationVersion.current; currentPath.current = path; window.history.pushState(null, '', path); setPathname(path); };
  const start = async (request: CreateRequest) => {
    const intent = JSON.stringify([request.prompt,request.uploadIds ?? []]);
    let requestId = pendingCreation.current?.prompt === intent ? pendingCreation.current.requestId : crypto.randomUUID();
    try {
      const prior = JSON.parse(sessionStorage.getItem('yrkie.pending-generation') || 'null');
      if (prior?.prompt === intent && typeof prior.requestId === 'string') requestId = prior.requestId;
      sessionStorage.setItem('yrkie.pending-generation', JSON.stringify({ prompt: intent, requestId }));
    } catch { /* The in-memory receipt still survives an explicit retry when storage is disabled. */ }
    pendingCreation.current = { prompt: intent, requestId };
    const project = await startGeneration(request.prompt, requestId, request.uploadIds);
    pendingCreation.current = null;
    try { sessionStorage.removeItem('yrkie.pending-generation'); } catch { /* Optional recovery record. */ }
    navigate(`/work/${encodeURIComponent(project.id)}`);
  };
  const loadRecentProjects = useCallback(async () => {
    const { listProjects } = await import('./lib/projects');
    return (await listProjects()).map(({ id, title, updatedAt }) => ({ id, title, updatedAt }));
  }, []);
  const work = /^\/work\/([a-zA-Z0-9_-]+)\/?$/.exec(pathname);
  const generation = /^\/create\/(srv-[a-zA-Z0-9_-]+)\/?$/.exec(pathname);
  const projectId = work?.[1] ?? generation?.[1];
  if (/^\/(present|presenter)\/[0-9a-f]{64}\/?$/.test(pathname)) return <Suspense fallback={<main className="application-failure" role="status">正在打开演示…</main>}><PresentationRoute pathname={pathname} /></Suspense>;
  if (projectId) return <Suspense fallback={<main className="application-failure" role="status">正在打开文稿…</main>}>
    {isServerProject(projectId) ? <GenerationWorkPage key={projectId} projectId={projectId} onBack={() => navigate('/create')} registerLeaveGuard={registerLeaveGuard} />
      : <WorkPage key={projectId} projectId={projectId} onBack={() => navigate('/create')} registerLeaveGuard={registerLeaveGuard} />}
  </Suspense>;
  return <div className="app-shell dashboard-shell" data-theme="light" data-ui-theme="light">
    <AppHeader />
    <CreatePage onCreate={start} loadRecentProjects={loadRecentProjects} onOpenProject={id => navigate(`/work/${encodeURIComponent(id)}`)} />
  </div>;
}
