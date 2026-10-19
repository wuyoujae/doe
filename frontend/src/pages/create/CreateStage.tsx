import { useLayoutEffect, useRef, type ReactNode } from 'react';

export function CreateStage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current!;
    const content = contentRef.current!;
    const examples = content.querySelector<HTMLElement>('.dashboard-prompt-examples')!;
    const categories = examples.querySelector<HTMLElement>('.dashboard-prompt-example-categories')!;
    const measure = () => {
      // Keep the collapsed composition centered, independently of the expanding panel.
      const height = categories.getBoundingClientRect().bottom - content.getBoundingClientRect().top;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      stage.style.setProperty('--dashboard-create-collapsed-height', `${height / rem}rem`);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    for (const child of content.children) {
      if (child !== examples) observer?.observe(child);
    }
    observer?.observe(categories);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  return <div className="dashboard-create-stage" ref={stageRef}>
    <div className="dashboard-create-content" ref={contentRef}>{children}</div>
  </div>;
}
