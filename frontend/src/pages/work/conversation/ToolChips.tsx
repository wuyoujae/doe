// Origin: commercial 2026-10-12 components/ToolChips.tsx
import {
  BookOpen,
  Bot,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  ListChecks,
  PenLine,
  Puzzle,
  Terminal,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ToolMessageItem } from './types';

type ToolChipsProps = {
  items: ToolMessageItem[];
  collapseCompleted?: boolean;
};

function toolNameFromItem(item: ToolMessageItem) {
  if (item.toolName?.trim()) return item.toolName.trim();
  if (!item.tools || typeof item.tools !== 'object' || Array.isArray(item.tools)) return '';
  const functionName = (item.tools as { function_name?: unknown }).function_name;
  return typeof functionName === 'string' ? functionName.trim() : '';
}

export function isValidToolCallName(value: string) {
  const normalized = value.trim();
  return normalized.length > 0
    && normalized.length <= 64
    && /^[A-Za-z0-9_-]+$/.test(normalized);
}

function humanizeToolName(value: string, fallback: string) {
  const normalized = value
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return fallback;
  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

function subAgentIdFromItem(item: ToolMessageItem) {
  const subject = item.toolSubject?.trim();
  if (subject) return subject;
  return item.label.match(/\b([a-z0-9][a-z0-9_-]*-agent)\b/i)?.[1] ?? '';
}

function iconForTool(toolName: string): LucideIcon {
  const normalized = toolName.toLowerCase();
  if (normalized === 'callsubagent') return Bot;
  if (normalized === 'confirmoutline') return ListChecks;
  if (normalized === 'generateimage') return ImageIcon;
  if (normalized === 'skill') return BookOpen;
  if (normalized === 'plugin_tool') return Puzzle;
  if (normalized.includes('read') || normalized.includes('list')) return FileText;
  if (
    normalized.includes('write')
    || normalized.includes('edit')
    || normalized.includes('create')
    || normalized.includes('apply')
    || normalized.includes('delete')
  ) {
    return PenLine;
  }
  if (normalized.includes('run') || normalized.includes('exec')) return Terminal;
  return Wrench;
}

export const ToolChips = memo(function ToolChips({
  items,
  collapseCompleted = false,
}: ToolChipsProps) {
  const { t } = useTranslation('ui');
  const [isOpen, setIsOpen] = useState(!collapseCompleted);
  const visibleItems = useMemo(
    () => items.filter((item) => {
      const toolName = toolNameFromItem(item);
      return !toolName || isValidToolCallName(toolName);
    }),
    [items],
  );
  const summary = t('messages.toolChips.toolCalls', { count: visibleItems.length });

  useEffect(() => {
    if (collapseCompleted) setIsOpen(false);
  }, [collapseCompleted]);

  if (visibleItems.length === 0) return null;

  return (
    <section className={`tool-chips${isOpen ? ' is-open' : ''}`} aria-label={summary}>
      <button
        className="tool-chips-summary"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <ChevronDown className="tool-chips-summary-chevron" aria-hidden="true" />
        <span>{summary}</span>
      </button>
      <div className="tool-chips-body-wrapper" aria-hidden={!isOpen}>
        <div className="tool-chips-body">
          <div className="tool-chips-rows">
            {visibleItems.map((item) => (
              <ToolChipRow
                key={item.id}
                item={item}
                collapseCompleted={collapseCompleted}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

const ToolChipRow = memo(function ToolChipRow({
  item,
  collapseCompleted,
}: {
  item: ToolMessageItem;
  collapseCompleted: boolean;
}) {
  const { t } = useTranslation(['ui', 'app']);
  const detail = item.detail?.trim() ?? '';
  const canExpand = Boolean(detail) && item.toolExpandable !== false;
  const [isOpen, setIsOpen] = useState(false);
  const toolName = useMemo(() => toolNameFromItem(item), [item]);
  const toolLabel = item.labelKey ? t(`app:chat.${item.labelKey}`) : item.label;
  const displayName = humanizeToolName(toolName, t('app:chat.toolCall'));
  const subAgentId = toolName.toLowerCase() === 'callsubagent' ? subAgentIdFromItem(item) : '';
  const displayValue = subAgentId === 'social-card-outline-agent'
    ? t('ui:socialAgents.outline')
    : subAgentId === 'social-card-agent'
      ? t('ui:socialAgents.card')
      : subAgentId === 'outline-agent-traditional'
    ? t('ui:toolAgents.outlineTraditional')
    : subAgentId === 'doe-agent'
      ? 'DOE Agent'
      : subAgentId === 'outline-agent-doe'
      ? t('ui:toolAgents.outlineDoe')
      : subAgentId === 'outline-agent'
    ? t('ui:toolAgents.outline')
    : subAgentId === 'slide-agent-traditional'
      ? t('ui:toolAgents.slideTraditional')
      : subAgentId === 'slide-agent-doe'
        ? t('ui:toolAgents.slideDoe')
        : subAgentId === 'slide-agent'
      ? t('ui:toolAgents.slide')
      : subAgentId === 'data-agent' || subAgentId === 'data-processing-agent'
        ? t('ui:toolAgents.data')
        : subAgentId === 'document-agent' || subAgentId === 'document-generation-agent'
          ? t('ui:toolAgents.document')
          : subAgentId === 'research-agent' || subAgentId === 'deep-research-agent'
            ? t('ui:toolAgents.research')
      : subAgentId
        ? humanizeToolName(subAgentId, toolLabel)
        : toolLabel;
  const Icon = iconForTool(toolName);

  useEffect(() => {
    if (!canExpand && isOpen) setIsOpen(false);
  }, [canExpand, isOpen]);

  useEffect(() => {
    if (collapseCompleted) setIsOpen(false);
  }, [collapseCompleted]);

  const rowContent = (
    <>
      <span className="tool-chip-icon-slot" aria-hidden="true">
        <Icon className="tool-chip-tool-icon" />
        {canExpand ? <ChevronDown className="tool-chip-row-chevron" /> : null}
      </span>
      <span className="tool-chip-name">{displayName}</span>
      <span className="tool-chip-value" title={displayValue}>{displayValue}</span>
    </>
  );

  return (
    <div
      className={`tool-chip-row state-${item.status}${isOpen ? ' is-open' : ''}${canExpand ? ' is-expandable' : ' is-static'}`}
      data-tool-name={toolName || undefined}
      data-expandable={canExpand ? 'true' : 'false'}
    >
      {canExpand ? (
        <button
          className="tool-chip-row-main"
          type="button"
          aria-expanded={isOpen}
          aria-label={`${displayName}: ${displayValue}`}
          onClick={() => setIsOpen((current) => !current)}
        >
          {rowContent}
        </button>
      ) : (
        <div className="tool-chip-row-main" aria-busy={item.status === 'running'}>
          {rowContent}
        </div>
      )}
      {canExpand ? (
        <div className="tool-chip-detail-wrapper" aria-hidden={!isOpen}>
          <div className="tool-chip-detail-clip">
            <pre className="tool-chip-detail">{detail}</pre>
          </div>
        </div>
      ) : null}
    </div>
  );
});
