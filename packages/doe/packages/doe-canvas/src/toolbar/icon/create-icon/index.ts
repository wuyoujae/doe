import type { LucideRuntime } from "../../contracts/index.ts";

export function createIcon(documentTarget: Document, name: string, className: string): Element | null {
  const view = documentTarget.defaultView as (Window & { lucide?: LucideRuntime }) | null;
  const runtime = view?.lucide;
  const icon = runtime?.icons?.[name] ?? runtime?.[name];
  if (!icon || typeof runtime?.createElement !== 'function') return null;
  return runtime.createElement(icon, {
    class: className,
    'aria-hidden': 'true',
    'stroke-width': 2,
  });
}
