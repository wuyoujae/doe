import { Play } from 'lucide-react';
import { useEffect,useRef,useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { PresentationAccessDialog } from './PresentationAccessDialog';
import { registerPresentationPreparer } from './services/presentationPlaybackBridge';

export type PreparedPresentation = { sourceRevision:number; projectId?:string };
type Props = { projectId:string; title:string; disabled?:boolean; prepare:()=>Promise<PreparedPresentation|null>; buttonHost?:HTMLElement|null };
/** Flushes the original editor before opening a stage; legacy imports may return their server ID. */
export function WorkPresentationActions({projectId,title,disabled,prepare,buttonHost}:Props) {
  const {t}=useTranslation('presentation');
  const [target,setTarget]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const callbacks=useRef(prepare);callbacks.current=prepare;
  const alive=useRef(true),active=useRef(projectId);active.current=projectId;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{setTarget(null);setError('');},[projectId]);
  useEffect(()=>target ? registerPresentationPreparer(target,async()=>{
    const value=await callbacks.current();
    if (!value || (value.projectId && value.projectId!==target)) throw new Error('Playback source changed');
    return {slideDeckFormat:'schema-v4',sourceRevision:value.sourceRevision};
  }):undefined,[target]);
  const open=async()=>{
    if(busy || disabled)return;const requested=projectId;setBusy(true);setError('');
    try{const value=await callbacks.current();if(!value)throw new Error('Save the document before playback');if(alive.current && active.current===requested)setTarget(value.projectId || requested);}
    catch{if(alive.current && active.current===requested)setError(t('failed'));}
    finally{if(alive.current)setBusy(false);}
  };
  const button=<><button className="work-nav-action-btn present" type="button" aria-label={t('title')} disabled={disabled || busy} onClick={()=>void open()}><Play aria-hidden="true" /><span>{t(busy?'loading':'title')}</span></button>
    {error && <span role="alert" className="presentation-action-error">{error}</span>}</>;
  return <>{buttonHost === undefined ? button : buttonHost ? createPortal(button,buttonHost) : null}
    {target && createPortal(<PresentationAccessDialog sessionId={target} title={title} onClose={()=>setTarget(null)} />,document.querySelector('.work-shell') || document.body)}</>;
}
