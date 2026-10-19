// Origin: commercial 2026-10-12 features/work/questions/model.ts
import type { MessageGroup, ToolMessageItem } from '../types';

export type DoeQuestion = {
  id: string;
  question: string;
  options: { label: string; description?: string; recommended: boolean }[];
  allowMultiple: boolean;
};
export type DoeQuestionsReceipt = {
  status: 'awaiting_user';
  requestId: string;
  questions: DoeQuestion[];
};
export type DoeQuestionAnswer = { selected: number[]; custom: string };
export type DoeQuestionAnswers = Record<string, DoeQuestionAnswer>;
export type SubmittedAnswer = { id: string; answer: string };
export type DoeQuestionsContext = {
  scopeKey: string;
  blockedReason?: string;
  busy?: boolean;
  activeRequestId?: string | null;
  answersByRequest?: Record<string, SubmittedAnswer[]>;
  onSubmit: (requestId: string, prompt: string, answers: SubmittedAnswer[]) => Promise<void>;
  onUpload?: () => void;
};

function object(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0
    && [...value].length <= max && !value.includes('\0');
}

// Validate persisted tool output as well as live events; invalid tools keep their normal chip.
export function parseDoeQuestions(value: unknown): DoeQuestionsReceipt | null {
  if (typeof value === 'string') {
    if (value.length > 24000) return null;
    try { value = JSON.parse(value); } catch { return null; }
  }
  const result = object(value);
  if (!result || (result.status !== undefined && result.status !== 'awaiting_user') || !text(result.requestId, 1024)
    || !Array.isArray(result.questions) || result.questions.length < 1 || result.questions.length > 4) return null;
  const ids = new Set<string>();
  const questions: DoeQuestion[] = [];
  for (const raw of result.questions) {
    const q = object(raw);
    if (!q || !text(q.id, 40) || !/^[A-Za-z0-9_-]+$/.test(q.id) || ids.has(q.id)
      || !text(q.question, 500) || (q.allowMultiple !== undefined && typeof q.allowMultiple !== 'boolean')) return null;
    ids.add(q.id);
    const choices = q.options ?? [];
    if (!Array.isArray(choices) || (choices.length !== 0 && (choices.length < 2 || choices.length > 4))) return null;
    const options: DoeQuestion['options'] = [];
    const labels = new Set<string>();
    for (const rawOption of choices) {
      const option = typeof rawOption === 'string' ? { label: rawOption } : object(rawOption);
      if (!option || !text(option.label, 450) || labels.has(option.label.toLowerCase())
        || (option.description !== undefined && !text(option.description, 300))
        || (option.recommended !== undefined && typeof option.recommended !== 'boolean')) return null;
      labels.add(option.label.toLowerCase());
      options.push({ label: option.label, description: option.description as string | undefined, recommended: option.recommended === true });
    }
    if (options.filter((option) => option.recommended).length > 1) return null;
    questions.push({ id: q.id, question: q.question, options, allowMultiple: q.allowMultiple === true });
  }
  return { status: 'awaiting_user', requestId: result.requestId, questions };
}

export function questionsFromTool(item: ToolMessageItem): DoeQuestionsReceipt | null {
  const tools = object(item.tools);
  const name = tools?.function_name ?? tools?.functionName ?? item.toolName;
  return name === 'AskQuestions' ? parseDoeQuestions(tools?.result) : null;
}

export function latestDoeQuestionsRequest(messages: MessageGroup[]): string | null {
  let current: string | null = null;
  for (const group of messages) {
    if (group.role === 'user') current = null;
    else for (const item of group.items) {
      if (item.type === 'tool') current = questionsFromTool(item)?.requestId ?? current;
    }
  }
  return current;
}

export function emptyAnswers(receipt: DoeQuestionsReceipt): DoeQuestionAnswers {
  return Object.fromEntries(receipt.questions.map((question) => [question.id, { selected: [], custom: '' }]));
}

/** Restore the persisted answer instead of depending on a tab's temporary form storage. */
export function restoreSubmittedAnswers(receipt: DoeQuestionsReceipt, saved: SubmittedAnswer[]): DoeQuestionAnswers {
  const answers = emptyAnswers(receipt);
  for (const question of receipt.questions) {
    let remaining = saved.find(answer => answer.id === question.id)?.answer ?? '';
    const selected: number[] = [];
    for (const [index, option] of question.options.entries()) {
      if (remaining === option.label || remaining.startsWith(`${option.label}\n`)) {
        selected.push(index);
        remaining = remaining.slice(option.label.length).replace(/^\n/, '');
        if (!question.allowMultiple) break;
      }
    }
    answers[question.id] = { selected, custom: remaining };
  }
  return answers;
}

export function structuredDoeAnswers(receipt: DoeQuestionsReceipt, answers: DoeQuestionAnswers): SubmittedAnswer[] {
  return receipt.questions.map(question => {
    const answer = answers[question.id];
    const selected = question.options.filter((_, index) => answer.selected.includes(index)).map(option => option.label);
    return { id: question.id, answer: [...selected, answer.custom.trim()].filter(Boolean).join('\n') };
  });
}

export function answersComplete(receipt: DoeQuestionsReceipt, answers: DoeQuestionAnswers): boolean {
  return receipt.questions.every((question) => {
    const answer = answers[question.id];
    return answer && (answer.selected.length > 0 || answer.custom.trim().length > 0);
  });
}

export function formatDoeAnswers(receipt: DoeQuestionsReceipt, answers: DoeQuestionAnswers, heading: string): string {
  return `${heading}\n\n${receipt.questions.map((question, index) => {
    const answer = answers[question.id];
    const lines = question.options.filter((_, optionIndex) => answer.selected.includes(optionIndex)).map((option) => option.label);
    if (answer.custom.trim()) lines.push(answer.custom.trim());
    return `${index + 1}. ${question.question}\n${lines.join('\n')}`;
  }).join('\n\n')}`;
}
