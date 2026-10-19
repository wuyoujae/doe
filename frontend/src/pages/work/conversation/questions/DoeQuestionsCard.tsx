// Origin: commercial 2026-10-12 features/work/questions/DoeQuestionsCard.tsx
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { answersComplete, emptyAnswers, formatDoeAnswers, restoreSubmittedAnswers, structuredDoeAnswers, type DoeQuestionAnswers, type DoeQuestionsContext, type DoeQuestionsReceipt } from './model';
import './questions.css';

function restoreDraft(key: string, receipt: DoeQuestionsReceipt): DoeQuestionAnswers {
  const empty = emptyAnswers(receipt);
  try {
    const draft = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (draft?.fingerprint !== JSON.stringify(receipt.questions)) return empty;
    for (const question of receipt.questions) {
      const answer = draft.answers?.[question.id];
      if (!answer || !Array.isArray(answer.selected) || typeof answer.custom !== 'string') continue;
      const selected = [...new Set<number>(answer.selected.filter((index: unknown): index is number =>
        typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < question.options.length))];
      empty[question.id] = { selected: question.allowMultiple ? selected : selected.slice(0, 1), custom: answer.custom.slice(0, 4000) };
    }
  } catch { /* Storage may be unavailable; the current form remains usable. */ }
  return empty;
}

export function DoeQuestionsCard({ receipt, active, context }: {
  receipt: DoeQuestionsReceipt;
  active: boolean;
  context: DoeQuestionsContext;
}) {
  const { t } = useTranslation('doeQuestions');
  const controlId = useId();
  const storageKey = `yrkie:doe-questions:${encodeURIComponent(context.scopeKey)}:${encodeURIComponent(receipt.requestId)}`;
  const savedAnswers = context.answersByRequest?.[receipt.requestId];
  const [answers, setAnswers] = useState(() => savedAnswers ? restoreSubmittedAnswers(receipt, savedAnswers) : restoreDraft(storageKey, receipt));
  const [submitting, setPending] = useState(false);
  const pending = submitting || Boolean(context.busy);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const sending = useRef(false);
  const readOnly = !active || submitted || Boolean(savedAnswers);
  const complete = answersComplete(receipt, answers);

  useEffect(() => {
    if (savedAnswers) setAnswers(restoreSubmittedAnswers(receipt, savedAnswers));
  }, [savedAnswers, receipt]);

  useEffect(() => {
    try {
      if (submitted) sessionStorage.removeItem(storageKey);
      else if (!readOnly) sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint: JSON.stringify(receipt.questions), answers }));
    } catch { /* A browser storage restriction must not prevent answering. */ }
  }, [answers, readOnly, submitted, receipt.questions, storageKey]);

  const submit = async () => {
    if (sending.current || pending || readOnly || context.blockedReason || !complete) return;
    sending.current = true;
    setPending(true);
    setError(false);
    try {
      await context.onSubmit(receipt.requestId, formatDoeAnswers(receipt, answers, t('answerHeading')), structuredDoeAnswers(receipt, answers));
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      sending.current = false;
      setPending(false);
    }
  };

  return (
    <section className="doe-questions" aria-labelledby={`${controlId}-title`} aria-busy={pending}>
      <header className="doe-questions-header">
        <h3 id={`${controlId}-title`}>{t('title')}</h3>
        <p>{readOnly ? t('continued') : t('hint')}</p>
      </header>
      {receipt.questions.map((question, questionIndex) => {
        const answer = answers[question.id];
        const questionId = `${controlId}-${questionIndex}`;
        return (
          <fieldset className="doe-questions-field" key={question.id} disabled={readOnly || pending}>
            <legend><span className="doe-questions-number" aria-hidden="true">{questionIndex + 1}</span>{question.question}</legend>
            {question.options.length > 0 && <p className="doe-questions-instruction" id={`${questionId}-hint`}>{t(question.allowMultiple ? 'chooseMany' : 'chooseOne')}</p>}
            <div className="doe-questions-options">
              {question.options.map((option, optionIndex) => (
                <label key={option.label} className={`doe-questions-option${answer.selected.includes(optionIndex) ? ' is-selected' : ''}`}>
                  <input
                    type={question.allowMultiple ? 'checkbox' : 'radio'}
                    name={questionId}
                    checked={answer.selected.includes(optionIndex)}
                    aria-describedby={`${questionId}-hint`}
                    onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: {
                      ...current[question.id],
                      selected: question.allowMultiple
                        ? event.target.checked ? [...current[question.id].selected, optionIndex] : current[question.id].selected.filter((index) => index !== optionIndex)
                        : [optionIndex],
                    } }))}
                  />
                  <span className="doe-questions-option-copy">
                    <span className="doe-questions-option-heading"><span>{option.label}</span>{option.recommended && <span className="doe-questions-recommended">{t('recommended')}</span>}</span>
                    {option.description && <span className="doe-questions-description">{option.description}</span>}
                  </span>
                </label>
              ))}
            </div>
            {!readOnly && answer.selected.length > 0 && <button
              type="button" className="doe-questions-clear"
              onClick={() => setAnswers((current) => ({ ...current, [question.id]: { ...current[question.id], selected: [] } }))}
            >{t('clearSelection')}</button>}
            {(!readOnly || answer.custom) && <label className="doe-questions-custom" htmlFor={`${questionId}-custom`}>
              <span>{t(question.options.length ? 'custom' : 'freeText')}</span>
              <textarea
                id={`${questionId}-custom`}
                value={answer.custom}
                rows={2}
                maxLength={4000}
                onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: { ...current[question.id], custom: event.target.value } }))}
              />
            </label>}
          </fieldset>
        );
      })}
      {!readOnly && <footer className="doe-questions-footer">
        {context.onUpload && <p className="doe-questions-upload-hint">{t('uploadHint')}</p>}
        <div className="doe-questions-actions">
          {context.onUpload && <button className="doe-questions-upload" type="button" onClick={context.onUpload} disabled={pending}>{t('upload')}</button>}
          <button className="doe-questions-submit" type="button" disabled={pending || !complete || Boolean(context.blockedReason)} onClick={() => void submit()}>{t(pending ? 'submitting' : 'submit')}</button>
        </div>
        {context.blockedReason && <p className="doe-questions-status" role="status">{context.blockedReason}</p>}
        {error && <p className="doe-questions-status" role="alert">{t('submitError')}</p>}
      </footer>}
    </section>
  );
}
