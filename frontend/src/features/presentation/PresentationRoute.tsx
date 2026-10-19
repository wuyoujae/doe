import { LivePresentationPage } from './LivePresentationPage';
export function PresentationRoute({pathname}:{pathname:string}) {
  const match=/^\/(present|presenter)\/([0-9a-f]{64})\/?$/.exec(pathname);
  return match ? <LivePresentationPage link={match[2]} role={match[1]==='presenter'?'presenter':'audience'} /> : null;
}
