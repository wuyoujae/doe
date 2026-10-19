// Origin: commercial 2026-10-12 utils/markdown/renderer.tsx
// Markdown AST → React 组件渲染器
// 完全复刻 propertypes/markdown.html 的 otherone-md 样式体系

import { type ReactNode, useCallback, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BlockNode, InlineNode, TaskItem } from './types';
import { sanitizeUserFacingHref } from '../urlPolicy';

const iconSize = { width: '0.875rem', height: '0.875rem' };

// ============== 公开入口 ==============

type MarkdownRendererProps = {
  blocks: BlockNode[];
};

export function MarkdownRenderer({ blocks }: MarkdownRendererProps) {
  return (
    <div className="otherone-md">
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}

// ============== 块级渲染 ==============

function BlockView({ block }: { block: BlockNode }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p>
          {block.children.map((node, i) => (
            <InlineView key={i} node={node} />
          ))}
        </p>
      );

    case 'heading':
      const H = `h${block.level}` as keyof JSX.IntrinsicElements;
      return (
        <H>
          {block.children.map((node, i) => (
            <InlineView key={i} node={node} />
          ))}
        </H>
      );

    case 'code_block':
      return <CodeBlockView lang={block.lang} code={block.code} />;

    case 'blockquote':
      return (
        <blockquote>
          {block.children.map((child, i) => (
            <BlockView key={i} block={child} />
          ))}
        </blockquote>
      );

    case 'list':
      return block.ordered ? (
        <ol>
          {block.items.map((item, i) => (
            <li key={i}>
              {item.children.map((child, j) => (
                <BlockView key={j} block={child} />
              ))}
            </li>
          ))}
        </ol>
      ) : (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>
              {item.children.map((child, j) => (
                <BlockView key={j} block={child} />
              ))}
            </li>
          ))}
        </ul>
      );

    case 'task_list':
      return (
        <ul className="contains-task-list">
          {block.items.map((item, i) => (
            <TaskItemView key={i} item={item} />
          ))}
        </ul>
      );

    case 'table':
      return (
        <table>
          <thead>
            <tr>
              {block.header.map((cell, i) => (
                <th key={i}>
                  {cell.map((node, j) => (
                    <InlineView key={j} node={node} />
                  ))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>
                    {cell.map((node, k) => (
                      <InlineView key={k} node={node} />
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case 'hr':
      return <hr />;

    default:
      return null;
  }
}

// ============== 行内渲染 ==============

function InlineView({ node }: { node: InlineNode }) {
  switch (node.type) {
    case 'text':
      return <>{node.content}</>;

    case 'strong':
      return (
        <strong>
          {node.children.map((child, i) => (
            <InlineView key={i} node={child} />
          ))}
        </strong>
      );

    case 'em':
      return (
        <em>
          {node.children.map((child, i) => (
            <InlineView key={i} node={child} />
          ))}
        </em>
      );

    case 'del':
      return (
        <del>
          {node.children.map((child, i) => (
            <InlineView key={i} node={child} />
          ))}
        </del>
      );

    case 'codespan':
      return <code>{node.content}</code>;

    case 'link': {
      const href = sanitizeUserFacingHref(node.href);
      const children = node.children.map((child, i) => <InlineView key={i} node={child} />);
      return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ) : <>{children}</>;
    }

    case 'br':
      return <br />;

    default:
      return null;
  }
}

// ============== 专用子组件 ==============

function TaskItemView({ item }: { item: TaskItem }) {
  return (
    <li className="task-list-item">
      <input type="checkbox" checked={item.checked} readOnly />
      <span>
        {item.children.map((node, i) => (
          <InlineView key={i} node={node} />
        ))}
      </span>
    </li>
  );
}

function CodeBlockView({ lang, code }: { lang: string; code: string }) {
  const { t } = useTranslation('ui');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
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
        <button className="code-copy-btn" type="button" onClick={handleCopy}>
          {copied ? (
            <>
              <Check style={iconSize} /> {t('messages.copied')}
            </>
          ) : (
            <>
              <Copy style={iconSize} /> {t('messages.copy')}
            </>
          )}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
