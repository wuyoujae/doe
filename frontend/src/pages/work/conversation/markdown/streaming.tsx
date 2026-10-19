// Origin: commercial 2026-10-12 utils/markdown/streaming.tsx
// 流式 markdown 预解析渲染
// AI 边输出边检测 markdown 语法结构，提前渲染代码块等。
// v2: 加入稳定区解析缓存 — 避免每次 delta 重新解析已完成的段落。

import { useMemo } from 'react';
import { parseMarkdown } from './parser';
import { MarkdownRenderer } from './renderer';
import type { BlockNode } from './types';

/** 解析缓存：仅当 stable 文本变化时才重新解析 */
const stableCache: { text: string; blocks: BlockNode[] } = { text: '', blocks: [] };
const beforeFenceCache: { text: string; blocks: BlockNode[] } = { text: '', blocks: [] };

/**
 * 在流式输出期间，识别已闭合的 markdown 块和正在输出的最后一个块。
 * 已闭合的块正常 markdown 渲染，正在输出的块用 blur-word 做入场动画。
 *
 * 用 ref 缓存已解析的稳定区，避免每次 delta 重复解析整个文本。
 */
export function useStreamingMarkdown(content: string, isStreaming: boolean) {
  // 轻量 fence 计数 — 不需要完整解析
  const fenceCount = useMemo(() => {
    if (!content) return 0;
    const m = content.match(/^```/gm);
    return m ? m.length : 0;
  }, [content]);

  return useMemo(() => {
    if (!content) return null;
    if (!isStreaming) {
      // 完整输出 → 常规 markdown 渲染
      const blocks = parseMarkdown(content);
      return blocks.length === 0 ? <p></p> : <MarkdownRenderer blocks={blocks} />;
    }

    // --- 流式预解析 ---

    const hasOpenFence = fenceCount % 2 === 1;

    if (hasOpenFence) {
      // 有未闭合的代码围栏
      return renderOpenCodeBlockCached(content);
    }

    // 以最后一个 \n\n 为界，之前的部分完整解析，之后的部分 blur-word
    const lastBoundary = content.lastIndexOf('\n\n');
    if (lastBoundary >= 0) {
      const stable = content.slice(0, lastBoundary).trim();
      const active = content.slice(lastBoundary + 2);

      // 缓存：stable 没变就复用已解析的 blocks
      let stableBlocks: BlockNode[];
      if (stable === stableCache.text) {
        stableBlocks = stableCache.blocks;
      } else {
        stableBlocks = stable.length > 0 ? parseMarkdown(stable) : [];
        stableCache.text = stable;
        stableCache.blocks = stableBlocks;
      }

      return (
        <>
          {stableBlocks.length > 0 && <MarkdownRenderer blocks={stableBlocks} />}
          {active.length > 0 && <BlurLine text={active} />}
        </>
      );
    }

    // 全部在流式输出中 → 纯 blur-word
    return <BlurLine text={content} />;
  }, [content, isStreaming, fenceCount]);
}

// ---- helpers ----

/** 轻量 fence 位置查找（仅找到最后一个 fence 位置） */
function findLastFencePosition(raw: string): { index: number; line: string } | null {
  const re = /^```/gm;
  let match: RegExpExecArray | null;
  let last: { index: number; line: string } | null = null;
  while ((match = re.exec(raw)) !== null) {
    last = { index: match.index, line: raw.slice(match.index).split('\n')[0] };
  }
  return last;
}

/** 渲染未闭合代码块（带缓存） */
function renderOpenCodeBlockCached(raw: string) {
  const lastFence = findLastFencePosition(raw);
  if (!lastFence) return <BlurLine text={raw} />;

  const fenceLine = lastFence.line;
  const lang = fenceLine.slice(3).trim();

  // 围栏之前的内容 — 缓存解析
  const beforeFence = raw.slice(0, lastFence.index).trim();
  let stableBlocks: BlockNode[];
  if (beforeFence === beforeFenceCache.text) {
    stableBlocks = beforeFenceCache.blocks;
  } else {
    stableBlocks = beforeFence.length > 0 ? parseMarkdown(beforeFence) : [];
    beforeFenceCache.text = beforeFence;
    beforeFenceCache.blocks = stableBlocks;
  }

  // 围栏之后的内容
  const codeBody = raw.slice(lastFence.index + fenceLine.length + 1);
  const codeLines = codeBody.split('\n');
  const lastLine = codeLines.length > 0 ? codeLines[codeLines.length - 1] : '';
  const completedLines = codeLines.slice(0, -1);

  return (
    <>
      {stableBlocks.length > 0 && <MarkdownRenderer blocks={stableBlocks} />}
      <div className="code-wrapper">
        <div className="code-header">
          <div className="code-header-left">
            <div className="mac-controls">
              <div className="mac-dot red" />
              <div className="mac-dot yellow" />
              <div className="mac-dot green" />
            </div>
            {lang && <span className="code-lang">{lang}</span>}
          </div>
          <span className="code-copy-btn is-streaming">
            ●● ●
          </span>
        </div>
        <pre>
          <code>
            {completedLines.length > 0 ? completedLines.join('\n') + '\n' : ''}
            <span className="blur-word">{lastLine}</span>
          </code>
        </pre>
      </div>
    </>
  );
}

/** 单行 blur-word 渲染 */
function BlurLine({ text }: { text: string }) {
  const tokens = text.split(/(\s+)/);
  return (
    <p>
      {tokens.map((token, index) => (
        <span key={index} className="blur-word">
          {token}
        </span>
      ))}
    </p>
  );
}
