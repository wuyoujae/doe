export type RecordValue = Record<string, any>;
export type Item = { id: string; title?: string; text?: string; icon?: string; src?: string; alt?: string; source?: string; label?: string | number; bullets?: string[] };
export type Content = { items: Item[]; title?: string; subtitle?: string; itemColumns?: number | 'auto'; itemLayout?: string; columnPreference?: number | 'auto'; orientation?: 'vertical' | 'horizontal'; staggered?: boolean; connectors?: boolean };
export type Choice = { id: string; label: string; group: string; type: string; category?: 'base'; variant?: string; min: number; max: number; fields: string[]; required: string[]; columns: number; icons?: boolean };
export const CONTENTS_TYPE = 'contents';
export let CHOICES: readonly Choice[] = [];
let model: RecordValue;
/** Typed bridge to the same model loaded by every Canvas runtime. */
export function bindContentsModel(value: RecordValue) { model = value; CHOICES = value.CHOICES; }
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const eligible = (content: Content, choice: Choice): boolean => model.eligible(content, choice);
export const candidates = (content: Content | null): Choice[] => model.candidates(content);
export const currentChoice = (node: RecordValue): string | undefined => model.currentChoice(node);
export const extract = (node: RecordValue): Content | null => model.extract(node);
export const replace = (node: RecordValue, id: string, resolvedColumns?: number): RecordValue => model.replace(node,id,resolvedColumns);
export const findNode = (nodes: RecordValue[], id: string): RecordValue | undefined => model.findNode(nodes,id);
export const replaceInSchema = (schema: RecordValue, id: string, next: RecordValue): RecordValue => model.replaceInSchema(schema,id,next);
