import type { RecordValue } from '../model/index.ts';

/** Trial layout uses the same whole-page Canvas without a visible preview. */
export class ReplacementLayoutCheck {
  private canvas: any;
  constructor(sourceDocument: Document) {
    this.canvas = sourceDocument.createElement('doe-canvas');
    this.canvas.className = 'contents-replacement-staging';
    this.canvas.setAttribute('editable', 'false'); this.canvas.setAttribute('aria-hidden', 'true'); this.canvas.inert = true;
    sourceDocument.body.append(this.canvas);
  }
  mount(schema: RecordValue, options: RecordValue) { return this.canvas.mount(schema, options); }
  dispose() { this.canvas.dispose(); this.canvas.remove(); }
}
