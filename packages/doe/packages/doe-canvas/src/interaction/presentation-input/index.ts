/** Keep presenter shortcuts and blank-space navigation when focus enters an iframe. */
export function bindPresentationInput(frame: HTMLIFrameElement, container: HTMLElement) {
  const doc = frame.contentDocument!, parent = container.ownerDocument, view = parent.defaultView!;
  const interactive = (target: EventTarget | null) => (target as Element | null)?.closest?.('button,a,input,select,textarea,[contenteditable="true"],video,audio,[data-chart-interactive],[data-doe-interactive]');
  const forward = (key: string, source?: KeyboardEvent) => {
    const event = new KeyboardEvent('keydown', { key, code: source?.code, ctrlKey: source?.ctrlKey, altKey: source?.altKey, shiftKey: source?.shiftKey, metaKey: source?.metaKey, repeat: source?.repeat, bubbles: true, cancelable: true });
    parent.dispatchEvent(event);
    if (event.defaultPrevented) source?.preventDefault();
  };
  const keydown = (event: KeyboardEvent) => {
    if (!event.defaultPrevented && !(event.target as Element)?.closest?.('input,select,textarea,button,a,[contenteditable="true"]')) forward(event.key, event);
  };
  let start: { id: number; x: number; y: number } | null = null;
  const down = (event: PointerEvent) => { start = event.button === 0 && !interactive(event.target) ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null; };
  const up = (event: PointerEvent) => {
    const origin = start; start = null;
    if (!origin || origin.id !== event.pointerId || interactive(event.target)) return;
    const dx = event.clientX - origin.x, dy = event.clientY - origin.y;
    if (Math.hypot(dx, dy) < 8) forward('ArrowRight');
    else if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) forward(dx < 0 ? 'ArrowRight' : 'ArrowLeft');
  };
  const cancel = () => { start = null; };
  const move = () => container.dispatchEvent(new view.PointerEvent('pointermove', { bubbles: true }));
  doc.addEventListener('keydown', keydown); doc.addEventListener('pointerdown', down); doc.addEventListener('pointerup', up);
  doc.addEventListener('pointercancel', cancel); doc.addEventListener('pointermove', move);
  return () => { doc.removeEventListener('keydown', keydown); doc.removeEventListener('pointerdown', down); doc.removeEventListener('pointerup', up); doc.removeEventListener('pointercancel', cancel); doc.removeEventListener('pointermove', move); };
}
