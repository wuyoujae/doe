// Origin: commercial 2026-10-12 components/ThinkingState.tsx
import { ChevronDown, Globe2, Search, Sparkles, type LucideIcon } from 'lucide-react';
import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { MessageItemStatus, ToolMessageItem } from './types';
import { openExternalUrl } from './openExternalUrl';

export type WebTraceToolName = 'web_search' | 'web_fetch';

type ReasoningThinkingStateProps = {
  status: MessageItemStatus;
  label: string;
  children: ReactNode;
};

type SearchThinkingGroupProps = {
  items: ToolMessageItem[];
  toolName: WebTraceToolName;
  collapseCompleted?: boolean;
};

type SearchTraceRow = {
  title: string;
  detail: string;
  href: string;
};

type SearchTraceModel = {
  query: string;
  rows: SearchTraceRow[];
  remaining: number;
};

const sourceToneCount = 3;

function useTraceExpansion(
  status: MessageItemStatus,
  openWhileRunningByDefault = true,
) {
  const isRunning = status === 'running';
  const [isOpen, setIsOpen] = useState(isRunning && openWhileRunningByDefault);
  const wasRunningRef = useRef(isRunning);

  useEffect(() => {
    if (wasRunningRef.current && !isRunning) {
      setIsOpen(false);
    }
    wasRunningRef.current = isRunning;
  }, [isRunning]);

  return { isOpen, isRunning, setIsOpen };
}

function ThinkingHeader({
  bodyId,
  isOpen,
  isRunning,
  icon: Icon,
  filledIcon = false,
  label,
  onToggle,
}: {
  bodyId: string;
  isOpen: boolean;
  isRunning: boolean;
  icon: LucideIcon;
  filledIcon?: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="thinking-state-trigger"
      aria-controls={bodyId}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <Icon
        className={`thinking-state-leading-icon${filledIcon ? ' is-filled' : ''}`}
        aria-hidden="true"
      />
      <span className={`thinking-state-label${isRunning ? ' is-running' : ''}`}>
        {label}
      </span>
      <ChevronDown className="thinking-state-chevron" aria-hidden="true" />
    </button>
  );
}

function ThinkingTraceBody({
  bodyId,
  isOpen,
  children,
}: {
  bodyId: string;
  isOpen: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={bodyId}
      className={`thinking-state-body-wrapper${isOpen ? ' is-open' : ''}`}
      aria-hidden={!isOpen}
    >
      <div className="thinking-state-body">
        <div className="thinking-state-trace">
          <span className="thinking-state-line" aria-hidden="true" />
          <div className="thinking-state-rows">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ReasoningThinkingState({
  status,
  label,
  children,
}: ReasoningThinkingStateProps) {
  const bodyId = useId();
  const { isOpen, isRunning, setIsOpen } = useTraceExpansion(status, false);

  return (
    <div
      className={`thinking-state thinking-state-reasoning state-${status}${isOpen ? ' is-open' : ''}`}
    >
      <ThinkingHeader
        bodyId={bodyId}
        isOpen={isOpen}
        isRunning={isRunning}
        icon={Sparkles}
        filledIcon
        label={label}
        onToggle={() => setIsOpen((current) => !current)}
      />
      <ThinkingTraceBody bodyId={bodyId} isOpen={isOpen}>
        <div className="thinking-state-reasoning-content">{children}</div>
      </ThinkingTraceBody>
    </div>
  );
}

export function SearchThinkingGroup({
  items,
  toolName,
  collapseCompleted = false,
}: SearchThinkingGroupProps) {
  const { t } = useTranslation('ui');
  const bodyId = useId();
  const status = items.some((item) => item.status === 'running') ? 'running' : 'completed';
  const { isOpen, isRunning, setIsOpen } = useTraceExpansion(status);
  const models = useMemo(
    () => items.map((item) => ({ id: item.id, model: buildSearchTraceModel(item, toolName) })),
    [items, toolName],
  );
  const label = toolName === 'web_search'
    ? t(isRunning ? 'messages.thinkingState.searchingWeb' : 'messages.thinkingState.searchedWeb')
    : t(isRunning ? 'messages.thinkingState.fetchingWeb' : 'messages.thinkingState.fetchedWeb');

  useEffect(() => {
    if (collapseCompleted) setIsOpen(false);
  }, [collapseCompleted, setIsOpen]);

  return (
    <div
      className={`thinking-state thinking-state-search state-${status}${isOpen ? ' is-open' : ''}`}
      data-tool-name={toolName}
    >
      <ThinkingHeader
        bodyId={bodyId}
        isOpen={isOpen}
        isRunning={isRunning}
        icon={toolName === 'web_search' ? Search : Globe2}
        label={label}
        onToggle={() => setIsOpen((current) => !current)}
      />
      <ThinkingTraceBody bodyId={bodyId} isOpen={isOpen}>
        {models.map(({ id, model }, itemIndex) => (
          <div className="thinking-state-search-entry" key={id}>
            <div className="thinking-state-query">
              <Search aria-hidden="true" />
              <span>{model.query || label}</span>
            </div>
            {model.rows.map((row, index) => (
              <SearchSourceRow
                key={`${row.href}:${index}`}
                row={row}
                tone={(itemIndex + index) % sourceToneCount}
              />
            ))}
            {model.remaining > 0 ? (
              <span className="thinking-state-more">
                {t('messages.thinkingState.moreResults', { count: model.remaining })}
              </span>
            ) : null}
          </div>
        ))}
      </ThinkingTraceBody>
    </div>
  );
}

function SearchSourceRow({ row, tone }: { row: SearchTraceRow; tone: number }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    void openExternalUrl(row.href).catch(() => undefined);
  };

  return (
    <a
      className="thinking-state-source"
      href={row.href}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
    >
      <span className={`thinking-state-source-dot tone-${tone}`} aria-hidden="true">
        <Globe2 />
      </span>
      <span className="thinking-state-source-title">{row.title}</span>
      <span className="thinking-state-source-detail">{row.detail}</span>
    </a>
  );
}

export function resolveWebTraceToolName(item: ToolMessageItem): WebTraceToolName | null {
  if (item.toolName === 'web_search' || item.toolName === 'web_fetch') {
    return item.toolName;
  }

  const tools = asRecord(unwrapJson(item.tools));
  const persistedName = stringValue(tools?.function_name) || stringValue(tools?.functionName);
  if (persistedName === 'web_search' || persistedName === 'web_fetch') {
    return persistedName;
  }

  if (/^Searching\s+/i.test(item.label)) return 'web_search';
  if (/^Fetching\s+/i.test(item.label)) return 'web_fetch';
  return null;
}

function buildSearchTraceModel(
  item: ToolMessageItem,
  toolName: WebTraceToolName,
): SearchTraceModel {
  const tools = asRecord(unwrapJson(item.tools));
  const result = asRecord(unwrapJson(tools?.result));

  if (toolName === 'web_search') {
    const query = stringValue(result?.query) || item.label.replace(/^Searching\s+/i, '').trim();
    const allRows = Array.isArray(result?.results)
      ? result.results.flatMap((value) => {
          const record = asRecord(value);
          const href = safeWebUrl(stringValue(record?.url));
          if (!href) return [];
          return [{
            title: stringValue(record?.title) || hostnameFor(href),
            detail: hostnameFor(href),
            href,
          }];
        })
      : [];

    return {
      query,
      rows: allRows.slice(0, 3),
      remaining: Math.max(0, allRows.length - 3),
    };
  }

  const resultUrl = safeWebUrl(stringValue(result?.url));
  const labelUrl = safeWebUrl(item.label.replace(/^Fetching\s+/i, '').trim());
  const href = resultUrl || labelUrl;
  const statusDetail = [numberValue(result?.code), stringValue(result?.codeText)]
    .filter((value) => value !== '')
    .join(' ');

  return {
    query: href || item.label.replace(/^Fetching\s+/i, '').trim(),
    rows: href
      ? [{ title: hostnameFor(href), detail: statusDetail || hostnameFor(href), href }]
      : [],
    remaining: 0,
  };
}

function unwrapJson(value: unknown) {
  let current = value;
  for (let index = 0; index < 3 && typeof current === 'string'; index += 1) {
    try {
      current = JSON.parse(current);
    } catch {
      break;
    }
  }
  return current;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function safeWebUrl(value: string) {
  if (!value) return '';
  try {
    const parsed = new URL(value);
    const isLoopback = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (
      parsed.username
      || parsed.password
      || (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLoopback))
    ) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

function hostnameFor(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./i, '');
  } catch {
    return value;
  }
}
