import './translations';
import './styles.css';
// Origin: commercial 2026-10-12 components/MessagePanel.tsx
import {
  Check,
  ChevronDown,
  Copy,
  Image as ImageIcon,
  LoaderCircle,
  X,
} from 'lucide-react';
import {
  type ReactNode,
  type TouchEvent,
  type WheelEvent,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { appI18n } from '../../../i18n/i18n';
import { supportedLocales } from '../../../i18n/locales';
import { LoadingState } from '../components/generation/LoadingState';
import { AttachmentHistoryChip } from '../../../features/attachments/AttachmentHistoryChip';
import {
  ReasoningThinkingState,
  resolveWebTraceToolName,
  SearchThinkingGroup,
  type WebTraceToolName,
} from './ThinkingState';
import { ToolChips } from './ToolChips';
import { DoeQuestionsCard } from './questions/DoeQuestionsCard';
import { latestDoeQuestionsRequest, questionsFromTool, type DoeQuestionsContext, type DoeQuestionsReceipt } from './questions/model';
import { SubAgentAvatar } from './agents/SubAgentAvatar';
import type {
  AgentActivityMessageItem,
  AgentMessageItem,
  ImageMessageItem,
  MessageGroup,
  MessageItem,
  PlatformMessageLabelKey,
  SubAgentActivityKey,
  ThinkingMessageItem,
  ToolMessageItem,
  VisualCommandMessageItem,
} from './types';
import { parseMarkdown, MarkdownRenderer, useStreamingMarkdown } from './markdown';

const iconSize = { width: '0.875rem', height: '0.875rem' };
const projectAssetPathPattern = /^\/api\/v1\/projects\/srv-[a-f0-9-]{36}\/assets\/[a-f0-9]{64}$/i;
const webImageProviders = ['unsplash', 'pexels', 'pixabay'] as const;
const webImageHosts = {
  unsplash: new Set(['images.unsplash.com', 'plus.unsplash.com']),
  pexels: new Set(['images.pexels.com']),
  pixabay: new Set(['cdn.pixabay.com', 'pixabay.com', 'www.pixabay.com']),
} satisfies Record<WebImageProvider, Set<string>>;
const webImageSourceHosts = {
  unsplash: new Set(['unsplash.com', 'www.unsplash.com']),
  pexels: new Set(['pexels.com', 'www.pexels.com']),
  pixabay: new Set(['pixabay.com', 'www.pixabay.com']),
} satisfies Record<WebImageProvider, Set<string>>;
const imageLoadTimeoutMs = 30_000;
const imageRetryDelaysMs = [500, 1_000, 2_000] as const;
const platformMessageLabelKeys: PlatformMessageLabelKey[] = [
  'thinking',
  'thinkingCompleted',
  'thinkingInterrupted',
  'conversationInterrupted',
  'toolCall',
];
const legacyPlatformMessageLabels = new Map<string, PlatformMessageLabelKey>();
const subAgentActivityKeys = new Set<SubAgentActivityKey>([
  'outlineWorking',
  'slideWorking',
  'dataWorking',
  'documentWorking',
  'researchWorking',
  'working',
  'thinking',
  'searching',
  'usingTools',
  'generatingImages',
  'repairing',
  'regenerating',
  'validating',
  'saving',
  'completed',
  'failed',
  'cancelled',
]);

supportedLocales.forEach((locale) => {
  const translate = appI18n.getFixedT(locale, 'app');
  platformMessageLabelKeys.forEach((key) => {
    legacyPlatformMessageLabels.set(translate(`chat.${key}`), key);
  });
});

function resolvePlatformMessageLabel(
  item: ThinkingMessageItem | ToolMessageItem,
  t: TFunction,
) {
  const key = item.labelKey ?? legacyPlatformMessageLabels.get(item.label);
  return key ? t(`app:chat.${key}`) : item.label;
}

function getMessagePanelRowClass(message: MessageGroup, index: number, messages: MessageGroup[]) {
  const classes = ['message-panel-row'];
  const previous = messages[index - 1];

  if (message.role === 'user') {
    classes.push('chat-turn');
  }

  if (previous?.role === message.role) {
    classes.push('message-panel-row-compact');
  } else if (previous) {
    classes.push('message-panel-row-spaced');
  }

  return classes.join(' ');
}

type WebImageProvider = typeof webImageProviders[number];

type WebImageSearchImage = {
  id: string;
  provider: WebImageProvider;
  url: string;
  sourceUrl: string;
  width?: number;
  height?: number;
  author?: string;
  license?: string;
  alt?: string;
};

type WebImageSearchGallery = {
  query: string;
  images: WebImageSearchImage[];
};

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function boundedString(value: unknown, maxChars: number) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxChars);
}

function safeHttpsUrl(value: unknown, allowedHosts: Set<string>) {
  const raw = boundedString(value, 8_192);
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    if (
      parsed.protocol !== 'https:'
      || parsed.username
      || parsed.password
      || parsed.port
      || !allowedHosts.has(parsed.hostname.toLowerCase())
    ) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

function positiveImageDimension(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 100_000
    ? value
    : undefined;
}

function webImageSearchGallery(item: ToolMessageItem): WebImageSearchGallery | null {
  const tools = objectValue(item.tools);
  const functionName = boundedString(tools?.function_name, 160)
    || boundedString(tools?.functionName, 160)
    || boundedString(item.toolName, 160);
  if (functionName.toLowerCase() !== 'search_web_images') return null;

  let result: unknown = tools?.result;
  if (typeof result === 'string') {
    try {
      result = JSON.parse(result);
    } catch {
      return null;
    }
  }
  const resultObject = objectValue(result);
  if (!resultObject || resultObject.success === false || !Array.isArray(resultObject.images)) {
    return null;
  }

  const query = boundedString(resultObject.query, 100);
  const images = resultObject.images.slice(0, 20).flatMap((candidate, index) => {
    const image = objectValue(candidate);
    const provider = boundedString(image?.provider, 32).toLowerCase() as WebImageProvider;
    if (!image || !webImageProviders.includes(provider)) return [];
    const url = safeHttpsUrl(image.url, webImageHosts[provider]);
    if (!url) return [];
    const pageUrl = safeHttpsUrl(image.page_url ?? image.pageUrl, webImageSourceHosts[provider]);
    return [{
      id: boundedString(image.id, 160) || `${provider}-${index}`,
      provider,
      url,
      sourceUrl: pageUrl || url,
      width: positiveImageDimension(image.width),
      height: positiveImageDimension(image.height),
      author: boundedString(image.author, 160) || undefined,
      license: boundedString(image.license, 160) || undefined,
      alt: boundedString(image.alt, 500) || undefined,
    } satisfies WebImageSearchImage];
  });

  return images.length > 0 ? { query, images } : null;
}

type MessageDisplayPart =
  | { kind: 'questions'; receipt: DoeQuestionsReceipt }
  | { kind: 'item'; item: MessageItem }
  | { kind: 'tool-chips'; items: ToolMessageItem[] }
  | { kind: 'web-trace'; toolName: WebTraceToolName; items: ToolMessageItem[] }
  | { kind: 'web-images'; itemId: string; gallery: WebImageSearchGallery };

function groupMessageItemsForDisplay(items: MessageItem[], showQuestions = false): MessageDisplayPart[] {
  const parts: MessageDisplayPart[] = [];

  items.forEach((item) => {
    const previous = parts[parts.length - 1];
    if (item.type === 'tool') {
      const questions = showQuestions ? questionsFromTool(item) : null;
      if (questions) {
        if (!parts.some((part) => part.kind === 'questions' && part.receipt.requestId === questions.requestId)) {
          parts.push({ kind: 'questions', receipt: questions });
        }
        return;
      }
      const gallery = webImageSearchGallery(item);
      const webTraceToolName = resolveWebTraceToolName(item);
      if (webTraceToolName) {
        if (previous?.kind === 'web-trace' && previous.toolName === webTraceToolName) {
          previous.items.push(item);
        } else {
          parts.push({ kind: 'web-trace', toolName: webTraceToolName, items: [item] });
        }
        return;
      }
      if (previous?.kind === 'tool-chips') {
        previous.items.push(item);
      } else {
        parts.push({ kind: 'tool-chips', items: [item] });
      }
      if (gallery) {
        parts.push({ kind: 'web-images', itemId: item.id, gallery });
      }
      return;
    }
    parts.push({ kind: 'item', item });
  });

  return parts;
}

// ============================================================
// MessagePanel — 使用 react-virtuoso 虚拟滚动，仅渲染可见区域的消息
// ============================================================

export type MessagePanelProps = {
  questions?: DoeQuestionsContext;
  messages: MessageGroup[];
  emptyText?: string;
  isStreaming?: boolean;
  onBottomStateChange?: (atBottom: boolean) => void;
  onRangeChanged?: (range: { startIndex: number; endIndex: number }) => void;
};

export const MessagePanel = memo(
  forwardRef<VirtuosoHandle, MessagePanelProps>(function MessagePanel(
    { messages, emptyText, isStreaming = false, onBottomStateChange, onRangeChanged, questions },
    ref,
  ) {
    const { t } = useTranslation('ui');
    const activeQuestionsRequest = useMemo(() => questions ? questions.activeRequestId === undefined ? latestDoeQuestionsRequest(messages) : questions.activeRequestId : null, [messages, questions]);
    const virtuosoRef = useRef<VirtuosoHandle | null>(null);
    const followStreamRef = useRef(true);
    const ignoreBottomLossUntilRef = useRef(0);
    const followFrameRef = useRef<number | null>(null);
    const streamTailRef = useRef<HTMLDivElement | null>(null);
    const lastTouchYRef = useRef<number | null>(null);
    const previousLatestUserGroupIdRef = useRef<string | null>(null);
    const lastAiGroupId = useMemo(
      () => [...messages].reverse().find((message) => message.role === 'ai')?.id,
      [messages],
    );
    const latestUserGroupId = useMemo(
      () => [...messages].reverse().find((message) => message.role === 'user')?.id ?? '',
      [messages],
    );
    const setVirtuosoRef = useCallback((instance: VirtuosoHandle | null) => {
      virtuosoRef.current = instance;
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }
    }, [ref]);
    const scheduleTailFollow = useCallback((behavior: 'auto' | 'smooth' = 'auto') => {
      if (!followStreamRef.current) return;
      ignoreBottomLossUntilRef.current = performance.now() + 800;
      if (followFrameRef.current != null) {
        window.cancelAnimationFrame(followFrameRef.current);
      }
      followFrameRef.current = window.requestAnimationFrame(() => {
        followFrameRef.current = null;
        virtuosoRef.current?.scrollToIndex({
          index: 'LAST',
          align: 'end',
          behavior,
        });
        virtuosoRef.current?.autoscrollToBottom();
      });
    }, []);
    const handleBottomStateChange = useCallback((atBottom: boolean) => {
      if (atBottom) {
        followStreamRef.current = true;
      } else if (performance.now() > ignoreBottomLossUntilRef.current) {
        followStreamRef.current = false;
      }
      onBottomStateChange?.(atBottom);
    }, [onBottomStateChange]);
    const handleWheelCapture = useCallback((event: WheelEvent) => {
      if (isStreaming && event.deltaY < 0) {
        followStreamRef.current = false;
        ignoreBottomLossUntilRef.current = 0;
      }
    }, [isStreaming]);
    const handleTouchStartCapture = useCallback((event: TouchEvent) => {
      lastTouchYRef.current = event.touches[0]?.clientY ?? null;
    }, []);
    const handleTouchMoveCapture = useCallback((event: TouchEvent) => {
      const nextY = event.touches[0]?.clientY;
      if (
        isStreaming
        && nextY != null
        && lastTouchYRef.current != null
        && nextY > lastTouchYRef.current
      ) {
        followStreamRef.current = false;
        ignoreBottomLossUntilRef.current = 0;
      }
      lastTouchYRef.current = nextY ?? null;
    }, [isStreaming]);
    const followOutput = useCallback(() => (
      isStreaming && followStreamRef.current ? 'auto' as const : false
    ), [isStreaming]);

    useEffect(() => {
      if (!latestUserGroupId) {
        previousLatestUserGroupIdRef.current = null;
        return undefined;
      }
      if (previousLatestUserGroupIdRef.current === latestUserGroupId) {
        return undefined;
      }

      const isInitialPosition = previousLatestUserGroupIdRef.current == null;
      previousLatestUserGroupIdRef.current = latestUserGroupId;
      followStreamRef.current = true;
      scheduleTailFollow(isInitialPosition ? 'auto' : 'smooth');
      return undefined;
    }, [latestUserGroupId, scheduleTailFollow]);

    useLayoutEffect(() => {
      if (!isStreaming || !followStreamRef.current) return;
      scheduleTailFollow('auto');
    }, [isStreaming, messages, scheduleTailFollow]);

    useEffect(() => {
      if (!isStreaming || !streamTailRef.current || typeof ResizeObserver === 'undefined') {
        return undefined;
      }
      const observer = new ResizeObserver(() => scheduleTailFollow('auto'));
      observer.observe(streamTailRef.current);
      return () => observer.disconnect();
    }, [isStreaming, lastAiGroupId, scheduleTailFollow]);

    useEffect(() => () => {
      if (followFrameRef.current != null) {
        window.cancelAnimationFrame(followFrameRef.current);
      }
    }, []);

    if (messages.length === 0) {
      return <div className="message-panel-empty">{emptyText ?? t('messages.empty')}</div>;
    }

    return (
      <Virtuoso
        ref={setVirtuosoRef}
        className="message-panel-virtuoso"
        style={{ height: '100%' }}
        data={messages}
        followOutput={followOutput}
        atBottomThreshold={48}
        computeItemKey={(index, item) => item.id ?? index}
        itemContent={(index, message) => (
          <div
            ref={isStreaming && message.role === 'ai' && message.id === lastAiGroupId
              ? streamTailRef
              : undefined}
            id={message.role === 'user' ? `turn-${message.id}` : undefined}
            className={getMessagePanelRowClass(message, index, messages)}
          >
            <MessageGroupView
              message={message}
              questions={questions}
              activeQuestionsRequest={activeQuestionsRequest}
              nested={false}
              replyStreaming={isStreaming && message.id === lastAiGroupId}
              holdActions={isStreaming && message.role === 'ai' && message.id === lastAiGroupId}
              showGeneratingIndicator={isStreaming && message.role === 'ai' && message.id === lastAiGroupId}
            />
          </div>
        )}
        atBottomStateChange={handleBottomStateChange}
        onWheelCapture={handleWheelCapture}
        onTouchStartCapture={handleTouchStartCapture}
        onTouchMoveCapture={handleTouchMoveCapture}
        rangeChanged={onRangeChanged}
        increaseViewportBy={{ top: 400, bottom: 400 }}
        components={{
          Header: () => <div style={{ height: '1.5rem' }} />,
          Footer: () => <div className="message-panel-footer-spacer" />,
        }}
      />
    );
  }),
);

// ============================================================
// MessagePanelContent — 仅用于嵌套 Agent 子消息，不做虚拟滚动
// ============================================================

export function MessagePanelContent({ messages, nested = false, questions }: { messages: MessageGroup[]; nested?: boolean; questions?: DoeQuestionsContext }) {
  const questionContext = nested ? undefined : questions;
  const activeQuestionsRequest = questionContext ? questionContext.activeRequestId === undefined ? latestDoeQuestionsRequest(messages) : questionContext.activeRequestId : null;
  const lastAiGroup = [...messages].reverse().find((g) => g.role === 'ai');
  const isStreaming =
    !nested &&
    lastAiGroup != null &&
    lastAiGroup.items.some((item) => item.status === 'running');

  return (
    <div className={`message-panel ${nested ? 'message-panel-nested' : ''}`}>
      {messages.map((message) => {
        if (message.role === 'user') {
          return (
            <div key={message.id} id={`turn-${message.id}`} className="chat-turn">
              <MessageGroupView message={message} nested={nested} />
            </div>
          );
        }
        return (
          <MessageGroupView
            key={message.id}
            message={message}
            questions={questionContext}
            activeQuestionsRequest={activeQuestionsRequest}
            nested={nested}
            showGeneratingIndicator={isStreaming && message.id === lastAiGroup?.id}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// MessageGroupView
// ============================================================

const MessageGroupView = memo(function MessageGroupView({
  message,
  nested,
  replyStreaming,
  holdActions = false,
  showGeneratingIndicator = false,
  questions,
  activeQuestionsRequest,
}: {
  message: MessageGroup;
  nested: boolean;
  replyStreaming?: boolean;
  holdActions?: boolean;
  showGeneratingIndicator?: boolean;
  questions?: DoeQuestionsContext;
  activeQuestionsRequest?: string | null;
}) {
  const isStreaming = message.role === 'ai' && (
    replyStreaming ?? message.items.some((item) => item.status === 'running')
  );
  const collapseCompletedTools = message.role === 'ai' && !isStreaming;
  const visibleItems = useMemo(
    () => message.items.filter((item) => item.type !== 'text' || item.content.trim().length > 0),
    [message.items],
  );
  const displayParts = useMemo(() => groupMessageItemsForDisplay(visibleItems, Boolean(questions)), [visibleItems, questions]);
  const isAwaitingResponse = showGeneratingIndicator && visibleItems.length === 0;
  const copyText = useMemo(
    () => message.items
      .flatMap((item) => item.type === 'text' || item.type === 'visual_command'
        ? [item.content]
        : [])
      .filter(Boolean)
      .join('\n\n'),
    [message.items],
  );
  const hasCopyText = copyText.trim().length > 0;

  return (
    <article className={`message-group ${message.role === 'user' ? 'user-message' : 'ai-message'}${isAwaitingResponse ? ' is-awaiting-response' : ''}`}>
      {visibleItems.length > 0 ? (
        <div className="message-items-wrapper">
          {displayParts.map((part) => part.kind === 'tool-chips' ? (
            <ToolChips
              key={`tools-${part.items[0].id}`}
              items={part.items}
              collapseCompleted={collapseCompletedTools}
            />
          ) : part.kind === 'web-trace' ? (
            <SearchThinkingGroup
              key={`web-${part.items[0].id}`}
              items={part.items}
              toolName={part.toolName}
              collapseCompleted={collapseCompletedTools}
            />
          ) : part.kind === 'web-images' ? (
            <WebImageSearchGalleryView
              key={`web-images-${part.itemId}`}
              gallery={part.gallery}
            />
          ) : part.kind === 'questions' && questions ? (
            <DoeQuestionsCard
              key={`${questions.scopeKey}:${part.receipt.requestId}`}
              receipt={part.receipt}
              active={part.receipt.requestId === activeQuestionsRequest}
              context={questions}
            />
          ) : part.kind === 'item' ? (
            <MessageItemView
              key={part.item.id}
              item={part.item}
              collapseCompletedTools={collapseCompletedTools}
            />
          ) : null)}
        </div>
      ) : null}
      {showGeneratingIndicator ? <GeneratingIndicator /> : null}
      {!nested && !isStreaming && !holdActions && hasCopyText && <MessageActions text={copyText} />}
    </article>
  );
});

// ============================================================
// MessageItemView
// ============================================================

const MessageItemView = memo(function MessageItemView({
  item,
  collapseCompletedTools,
}: {
  item: MessageItem;
  collapseCompletedTools: boolean;
}) {
  const isStreaming = item.type === 'text' && item.status === 'running';

  if (item.type === 'text') {
    return (
      <div className="message-item-text">
        <RenderedTextContent content={item.content} isStreaming={isStreaming} />
      </div>
    );
  }

  if (item.type === 'image') {
    const assetUrl = resolveMessageImageAssetUrl(item.assetUrl);
    return (
      <ImageItemView
        key={`${item.generationId}:${assetUrl}`}
        item={item}
        assetUrl={assetUrl}
      />
    );
  }

  if (item.type === 'visual_command') {
    return <VisualCommandMessageItemView item={item} />;
  }

  if (item.type === 'attachment') {
    return (
      <AttachmentHistoryChip
        originalName={item.originalName}
        pipeline={item.pipeline}
        sizeBytes={item.sizeBytes}
      />
    );
  }

  if (item.type === 'agent') {
    return <AgentItemView item={item} collapseCompleted={collapseCompletedTools} />;
  }

  if (item.type === 'agent_activity') {
    return <AgentActivityItemView item={item} />;
  }

  if (item.type === 'thinking') {
    return <ThinkingItemView item={item} />;
  }

  const webTraceToolName = resolveWebTraceToolName(item);
  if (webTraceToolName) {
    return (
      <SearchThinkingGroup
        items={[item]}
        toolName={webTraceToolName}
        collapseCompleted={collapseCompletedTools}
      />
    );
  }

  return <ToolChips items={[item]} collapseCompleted={collapseCompletedTools} />;
});

function AgentActivityItemView({ item }: { item: AgentActivityMessageItem }) {
  const { t } = useTranslation('ui');
  const activityKey = subAgentActivityKeys.has(item.activityKey) ? item.activityKey : 'working';
  const Icon = item.status === 'running'
    ? LoaderCircle
    : item.status === 'failed' || item.status === 'cancelled'
      ? X
      : Check;

  return (
    <div className={`agent-activity-item state-${item.status}`} aria-busy={item.status === 'running'}>
      <Icon className="agent-activity-icon" aria-hidden="true" />
      <span>{t(`subAgentActivity.${activityKey}`)}</span>
    </div>
  );
}

type ImageLoadPhase = 'loading' | 'retry-wait' | 'loaded' | 'failed';

function resolveMessageImageAssetUrl(value?: string) {
  const path = value?.trim() ?? '';
  return projectAssetPathPattern.test(path)
    ? path
    : '';
}

function imageRetryDelay(generationId: string, attempt: number) {
  let hash = 0;
  const seed = `${generationId}:${attempt}`;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return imageRetryDelaysMs[attempt] + (hash % 251);
}

function VisualCommandMessageItemView({ item }: { item: VisualCommandMessageItem }) {
  const { t } = useTranslation('work');
  const assetUrl = resolveMessageImageAssetUrl(item.assetUrl);
  const imageItem: ImageMessageItem = {
    id: `${item.id}-image`,
    type: 'image',
    generationId: `${item.visualSubmissionId}:${item.visualCommandId}`,
    status: item.status,
    aspectRatio: item.aspectRatio ?? `${item.widthPx}:${item.heightPx}`,
    resolution: item.resolution,
    assetUrl: item.assetUrl,
    mediaType: item.mediaType,
    entryId: item.entryId,
    sourceRole: item.sourceRole,
    createdAt: item.createdAt,
  };

  return (
    <section className="message-item-visual-command">
      <p>
        {t('visual.commandMessageInstruction', {
          number: item.visualCommandIndex,
          instruction: item.content,
        })}
      </p>
      <ImageItemView
        item={imageItem}
        assetUrl={assetUrl}
        ariaLabel={t('visual.commandMessageImageAria', { number: item.visualCommandIndex })}
      />
    </section>
  );
}

function ImageItemView({
  item,
  assetUrl,
  ariaLabel,
}: {
  item: ImageMessageItem;
  assetUrl: string;
  ariaLabel?: string;
}) {
  const { t } = useTranslation(['editor', 'common']);
  const [attempt, setAttempt] = useState(0);
  const [loadPhase, setLoadPhase] = useState<ImageLoadPhase>(assetUrl ? 'loading' : 'failed');
  const ratio = /^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(item.aspectRatio)
    ? item.aspectRatio.replace(':', ' / ')
    : '1 / 1';
  const hasDeclaredAssetUrl = Boolean(item.assetUrl?.trim());
  const isGenerating = item.status === 'running' && !hasDeclaredAssetUrl && !item.error;
  const isResourceLoading =
    Boolean(assetUrl) &&
    !item.error &&
    (loadPhase === 'loading' || loadPhase === 'retry-wait');
  const isLoading = isGenerating || isResourceLoading;
  const error =
    item.error ||
    (!isGenerating && (!assetUrl || loadPhase === 'failed') ? t('editor:quick.imageRead') : '');

  const handleImageFailure = useCallback(() => {
    setLoadPhase((current) => {
      if (current !== 'loading') return current;
      return attempt < imageRetryDelaysMs.length ? 'retry-wait' : 'failed';
    });
  }, [attempt]);

  const handleImageLoad = useCallback(() => {
    setLoadPhase((current) => (current === 'loading' ? 'loaded' : current));
  }, []);

  const retryNow = useCallback(() => {
    setAttempt(0);
    setLoadPhase('loading');
  }, []);

  useEffect(() => {
    if (!assetUrl || item.error || loadPhase !== 'retry-wait') return undefined;
    const timeoutId = window.setTimeout(() => {
      setAttempt((current) => current + 1);
      setLoadPhase('loading');
    }, imageRetryDelay(item.generationId, attempt));
    return () => window.clearTimeout(timeoutId);
  }, [assetUrl, attempt, item.error, item.generationId, loadPhase]);

  useEffect(() => {
    if (!assetUrl || item.error || loadPhase !== 'failed') return undefined;
    const handleOnline = () => retryNow();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [assetUrl, item.error, loadPhase, retryNow]);

  return (
    <div
      className={`message-item-image${isLoading ? ' is-loading' : ''}${error ? ' is-error' : ''}`}
      style={{ aspectRatio: ratio }}
      aria-busy={isLoading}
      aria-label={ariaLabel ?? t('insert.generateImage')}
    >
      {error ? (
        <div className="message-image-error" role="alert">
          <span className="message-image-error-copy">
            <ImageIcon aria-hidden="true" />
            <span>{error}</span>
          </span>
          {!item.error && assetUrl && loadPhase === 'failed' ? (
            <button type="button" onClick={retryNow}>
              {t('common:actions.retry')}
            </button>
          ) : null}
        </div>
      ) : isGenerating || loadPhase === 'retry-wait' ? (
        <LoaderCircle className="message-image-spinner" aria-hidden="true" />
      ) : assetUrl ? (
        <>
          <MessageImageResource
            key={attempt}
            src={assetUrl}
            alt=""
            pending={loadPhase === 'loading'}
            onError={handleImageFailure}
            onLoad={handleImageLoad}
          />
          {loadPhase === 'loading' ? (
            <LoaderCircle className="message-image-spinner" aria-hidden="true" />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function WebImageSearchGalleryView({ gallery }: { gallery: WebImageSearchGallery }) {
  return (
    <section className="message-web-images" aria-label={gallery.query || 'Web image search results'}>
      <div className="message-web-images-grid">
        {gallery.images.map((image) => (
          <WebImageSearchTile
            key={`${image.provider}:${image.id}:${image.url}`}
            image={image}
            query={gallery.query}
          />
        ))}
      </div>
    </section>
  );
}

function WebImageSearchTile({ image, query }: { image: WebImageSearchImage; query: string }) {
  const { t } = useTranslation(['editor', 'common']);
  const [attempt, setAttempt] = useState(0);
  const [loadPhase, setLoadPhase] = useState<ImageLoadPhase>('loading');
  const label = image.alt || query || image.author || image.provider;
  const providerLabel = image.provider[0].toUpperCase() + image.provider.slice(1);
  const ratio = image.width && image.height ? `${image.width} / ${image.height}` : '4 / 3';

  const handleImageFailure = useCallback(() => {
    setLoadPhase((current) => {
      if (current !== 'loading') return current;
      return attempt < imageRetryDelaysMs.length ? 'retry-wait' : 'failed';
    });
  }, [attempt]);

  const handleImageLoad = useCallback(() => {
    setLoadPhase((current) => current === 'loading' ? 'loaded' : current);
  }, []);

  const retryNow = useCallback(() => {
    setAttempt(0);
    setLoadPhase('loading');
  }, []);

  useEffect(() => {
    if (loadPhase !== 'retry-wait') return undefined;
    const timeoutId = window.setTimeout(() => {
      setAttempt((current) => current + 1);
      setLoadPhase('loading');
    }, imageRetryDelay(`${image.provider}:${image.id}`, attempt));
    return () => window.clearTimeout(timeoutId);
  }, [attempt, image.id, image.provider, loadPhase]);

  useEffect(() => {
    if (loadPhase !== 'failed') return undefined;
    const handleOnline = () => retryNow();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [loadPhase, retryNow]);

  return (
    <article className="message-web-image-tile">
      <div
        className={`message-web-image-media${loadPhase === 'loading' || loadPhase === 'retry-wait' ? ' is-loading' : ''}${loadPhase === 'failed' ? ' is-error' : ''}`}
        style={{ aspectRatio: ratio }}
        aria-busy={loadPhase === 'loading' || loadPhase === 'retry-wait'}
      >
        {loadPhase === 'failed' ? (
          <div className="message-web-image-error" role="alert">
            <ImageIcon aria-hidden="true" />
            <span>{t('editor:quick.imageRead')}</span>
            <button type="button" onClick={retryNow}>{t('common:actions.retry')}</button>
          </div>
        ) : loadPhase === 'retry-wait' ? (
          <LoaderCircle className="message-image-spinner" aria-hidden="true" />
        ) : (
          <>
            <MessageImageResource
              key={attempt}
              src={image.url}
              alt={label}
              pending={loadPhase === 'loading'}
              onError={handleImageFailure}
              onLoad={handleImageLoad}
            />
            {loadPhase === 'loading' ? (
              <LoaderCircle className="message-image-spinner" aria-hidden="true" />
            ) : (
              <a
                className="message-web-image-open"
                href={image.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
              />
            )}
          </>
        )}
      </div>
      <a
        className="message-web-image-source"
        href={image.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={image.license}
      >
        <span>{providerLabel}</span>
        {image.author ? <span>{image.author}</span> : null}
      </a>
    </article>
  );
}

function MessageImageResource({
  src,
  alt,
  pending,
  onError,
  onLoad,
}: {
  src: string;
  alt: string;
  pending: boolean;
  onError: () => void;
  onLoad: () => void;
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const settledRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const settle = useCallback((callback: () => void) => {
    if (settledRef.current) return;
    settledRef.current = true;
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    callback();
  }, []);

  useEffect(() => {
    if (settledRef.current) return undefined;
    const startDeadline = () => {
      if (settledRef.current || timeoutRef.current != null) return;
      timeoutRef.current = window.setTimeout(() => {
        imageRef.current?.removeAttribute('src');
        settle(onError);
      }, imageLoadTimeoutMs);
    };

    if (typeof IntersectionObserver !== 'undefined' && imageRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observerRef.current?.disconnect();
          observerRef.current = null;
          startDeadline();
        },
        { rootMargin: '400px' },
      );
      observerRef.current.observe(imageRef.current);
    } else {
      startDeadline();
    }

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [onError, settle]);

  return (
    <img
      ref={imageRef}
      className={pending ? 'is-pending' : undefined}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => settle(onError)}
      onLoad={() => settle(onLoad)}
    />
  );
}

// ============================================================
// RenderedTextContent — 用 memo 避免已完成的文本消息重复解析 markdown
// ============================================================

const RenderedTextContent = memo(function RenderedTextContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  const streamingNodes = useStreamingMarkdown(content, isStreaming);

  if (!content) return <p></p>;

  return <>{streamingNodes}</>;
});

// ============================================================
// ThinkingItemView
// ============================================================

function ThinkingItemView({ item }: { item: ThinkingMessageItem }) {
  const { t } = useTranslation(['ui', 'app']);
  const isRunning = item.status === 'running';
  const displayLabel = resolvePlatformMessageLabel(item, t);

  const thinkingBlocks = useMemo(() => {
    if (item.status === 'completed' && item.content) {
      return parseMarkdown(item.content);
    }
    return null;
  }, [item.status, item.content]);

  return (
    <ReasoningThinkingState status={item.status} label={displayLabel}>
      {isRunning ? (
        <div className="thinking-log"><BlurWord text={item.content || ''} /></div>
      ) : thinkingBlocks ? (
        <MarkdownRenderer blocks={thinkingBlocks} />
      ) : (
        <div className="thinking-log">{item.content || t('ui:messages.thinking')}</div>
      )}
    </ReasoningThinkingState>
  );
}

// ============================================================
// AgentItemView
// ============================================================

function AgentItemView({
  item,
  collapseCompleted,
}: {
  item: AgentMessageItem;
  collapseCompleted: boolean;
}) {
  const { t } = useTranslation('ui');
  const isRunning = item.status === 'running';
  const [isOpen, setIsOpen] = useState(isRunning || Boolean(item.defaultOpen));
  const contentId = useId();
  const hasVisibleTrace = item.messages.some((group) => group.items.length > 0);
  const agentName = item.agentId === 'social-card-outline-agent'
    ? t('socialAgents.outline')
    : item.agentId === 'social-card-agent'
      ? t('socialAgents.card')
      : item.agentId === 'outline-agent-traditional'
    ? t('toolAgents.outlineTraditional')
    : item.agentId === 'doe-agent'
    ? 'DOE Agent'
    : item.agentId === 'outline-agent-doe'
      ? t('toolAgents.outlineDoe')
      : item.agentId === 'outline-agent'
    ? t('toolAgents.outline')
    : item.agentId === 'slide-agent-traditional'
      ? t('toolAgents.slideTraditional')
      : item.agentId === 'slide-agent-doe'
        ? t('toolAgents.slideDoe')
        : item.agentId === 'slide-agent'
      ? t('toolAgents.slide')
      : item.agentId === 'data-agent' || item.agentId === 'data-processing-agent'
        ? t('toolAgents.data')
        : item.agentId === 'document-agent' || item.agentId === 'document-generation-agent'
          ? t('toolAgents.document')
          : item.agentId === 'research-agent' || item.agentId === 'deep-research-agent'
            ? t('toolAgents.research')
            : item.label;
  const fallbackActivity = isRunning
    ? 'working'
    : item.status === 'failed' || item.status === 'cancelled'
      ? item.status
      : 'completed';
  const liveTraceActivity = isRunning ? currentAgentTraceActivity(item) : null;
  const activityKey = liveTraceActivity
    ?? (item.activityKey && subAgentActivityKeys.has(item.activityKey)
      ? item.activityKey
      : fallbackActivity);
  const activity = t(`subAgentActivity.${activityKey}`);
  const prevRunningRef = useRef(isRunning);
  useEffect(() => {
    if (prevRunningRef.current && !isRunning) {
      setIsOpen(false);
    }
    prevRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (collapseCompleted) setIsOpen(false);
  }, [collapseCompleted]);

  return (
    <div className={`message-item-collapsible message-item-agent state-${item.status} ${isOpen ? 'is-open' : ''}`}>
      <button
        className="collapsible-trigger"
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="agent-message-summary">
          <SubAgentAvatar agentId={item.agentId} label={item.label} isRunning={isRunning} />
          <span className="agent-message-copy">
            <span className="agent-message-name">{agentName}</span>
            <span className="agent-message-activity">{activity}</span>
          </span>
        </span>
        <ChevronDown className="chevron-icon" style={iconSize} />
      </button>
      <CollapsibleBody id={contentId} isOpen={isOpen}>
        <div className="collapsible-content agent-collapsible-content">
          {hasVisibleTrace ? (
            <MessagePanelContent messages={item.messages} nested />
          ) : isRunning ? (
            <LoadingState labels={[activity]} statusLabel={activity} variant="Dots" />
          ) : (
            <div className="agent-trace-unavailable">{t('subAgentActivity.completed')}</div>
          )}
        </div>
      </CollapsibleBody>
    </div>
  );
}

function currentAgentTraceActivity(item: AgentMessageItem): SubAgentActivityKey | null {
  const nestedItems = item.messages.flatMap((group) => group.items);
  for (let index = nestedItems.length - 1; index >= 0; index -= 1) {
    const nested = nestedItems[index];
    if (nested.status !== 'running') continue;
    if (nested.type === 'thinking') return 'thinking';
    if (nested.type === 'image') return 'generatingImages';
    if (nested.type === 'tool') {
      return resolveWebTraceToolName(nested) ? 'searching' : 'usingTools';
    }
  }
  return null;
}

// ============================================================
// CollapsibleBody
// ============================================================

function CollapsibleBody({ id, isOpen, children }: { id?: string; isOpen: boolean; children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (isOpen) wrapper.removeAttribute('inert');
    else wrapper.setAttribute('inert', '');
  }, [isOpen]);
  return (
    <div ref={wrapperRef} id={id} className="collapsible-body-wrapper" aria-hidden={!isOpen}>
      <div className="collapsible-body">{children}</div>
    </div>
  );
}

// ============================================================
// BlurWord — 流式入场动画
// ============================================================

function BlurWord({ text }: { text: string }) {
  const tokens = text.split(/(\s+)/);
  return (
    <>
      {tokens.map((token, index) => (
        <span key={index} className="blur-word">
          {token}
        </span>
      ))}
    </>
  );
}

// ============================================================
// MessageActions
// ============================================================

function MessageActions({ text }: { text: string }) {
  const { t } = useTranslation('ui');
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="message-actions">
      <button
        className="message-action-btn"
        type="button"
        title={copied ? t('messages.copied') : t('messages.copy')}
        aria-label={copied ? t('messages.messageCopied') : t('messages.copyMessage')}
        disabled={!text}
        onClick={() => void copyMessage()}
      >
        <Copy style={iconSize} />
      </button>
    </div>
  );
}

// ============================================================
// GeneratingIndicator
// ============================================================

function GeneratingIndicator() {
  const { t } = useTranslation('ui');
  const labels = useMemo(() => [
    t('messages.loadingState.churning'),
    t('messages.loadingState.vibing'),
    t('messages.loadingState.working'),
    t('messages.loadingState.thinking'),
    t('messages.loadingState.crafting'),
    t('messages.loadingState.shaping'),
    t('messages.loadingState.composing'),
    t('messages.loadingState.refining'),
  ], [t]);

  return (
    <LoadingState
      className="generating-indicator"
      labels={labels}
      statusLabel={t('messages.generating')}
      variant="Dots"
    />
  );
}
