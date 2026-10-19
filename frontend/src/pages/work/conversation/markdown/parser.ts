// Origin: commercial 2026-10-12 utils/markdown/parser.ts
// 行级 Markdown 解析器
// 将原始 markdown 文本解析为 BlockNode[] 的 AST

import type { BlockNode, InlineNode, ListItem, TableCell, TaskItem } from './types';

/**
 * 解析 markdown 字符串为块级 AST。
 * 采用逐行扫描 + 上下文状态机的方式，递归深度为 1（块→行内）。
 */
export function parseMarkdown(raw: string): BlockNode[] {
  // 按 \n 切割，保留行级顺序
  const lines = raw.split('\n');
  const blocks: BlockNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ---- 围栏代码块 (``` ... ```) ----
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // 跳过闭合 ```
      blocks.push({
        type: 'code_block',
        lang: lang || '',
        code: codeLines.join('\n'),
      });
      continue;
    }

    // ---- 空行：跳过 ----
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // ---- 标题 (h1-h6) ----
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const rawLevel = headingMatch[1].length;
      if (rawLevel >= 1 && rawLevel <= 6) {
        const level = rawLevel as 1 | 2 | 3 | 4 | 5 | 6;
        blocks.push({
          type: 'heading',
          level,
          children: parseInline(headingMatch[2]),
        });
        i++;
        continue;
      }
    }

    // ---- 分割线 (---, ***, ___) ----
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // ---- 引用块 (> ...) ----
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      // 递归解析引用块内部内容
      blocks.push({
        type: 'blockquote',
        children: parseMarkdown(quoteLines.join('\n')),
      });
      continue;
    }

    // ---- 表格 (| ... | ... |) ----
    if (/^\|.*\|/.test(line) && i + 1 < lines.length && /^\|[\s\-:|]+\|/.test(lines[i + 1])) {
      const table = parseTable(lines, i);
      if (table) {
        blocks.push(table.block);
        i = table.nextIndex;
        continue;
      }
    }

    if (/^\|.*\|/.test(line)) {
      blocks.push({
        type: 'paragraph',
        children: parseInline(line),
      });
      i++;
      continue;
    }

    // ---- 任务列表 (- [ ] / - [x]) ----
    const taskItemMatch = line.match(/^[\-\*]\s+\[([ xX])\]\s+(.*)/);
    if (taskItemMatch) {
      const taskItems: TaskItem[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^[\-\*]\s+\[([ xX])\]\s+(.*)/);
        if (!m) break;
        taskItems.push({
          checked: m[1].toLowerCase() === 'x',
          children: parseInline(m[2]),
        });
        i++;
      }
      blocks.push({ type: 'task_list', items: taskItems });
      continue;
    }

    // ---- 无序列表 (- / * / +) ----
    const ulMatch = line.match(/^[\-\*\+]\s+(?!\[[ xX]\])(.*)/);
    if (ulMatch) {
      const items: ListItem[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^[\-\*\+]\s+(?!\[[ xX]\])(.*)/);
        if (!m) break;
        // 检查是否有后续的续行（如缩进代码块）
        const contentLines: string[] = [m[1]];
        i++;
        while (i < lines.length && /^\s{2,}(?![\-\*\+])/.test(lines[i])) {
          contentLines.push(lines[i].trimStart());
          i++;
        }
        items.push({
          children: parseMarkdown(contentLines.join('\n')),
        });
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    // ---- 有序列表 (1. / 2.) ----
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (olMatch) {
      const items: ListItem[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\d+)\.\s+(.*)/);
        if (!m) break;
        const contentLines: string[] = [m[2]];
        i++;
        while (i < lines.length && /^\s{2,}(?!\d+\.)/.test(lines[i])) {
          contentLines.push(lines[i].trimStart());
          i++;
        }
        items.push({
          children: parseMarkdown(contentLines.join('\n')),
        });
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    // ---- 默认：段落 ----
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !isBlockStart(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        children: parseInline(paraLines.join('\n')),
      });
    }
  }

  return blocks;
}

// ---- 行内解析 ----

/**
 * 将一行（或行组）文本解析为行内节点数组。
 * 支持: **strong**, *em*, ~~del~~, `code`, [link](url)
 */
export function parseInline(raw: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let pos = 0;

  while (pos < raw.length) {
    // 行内代码 `...` (最高优先级)
    const codeMatch = matchAt(raw, pos, /^`([^`]+)`/);
    if (codeMatch) {
      nodes.push({ type: 'codespan', content: codeMatch[1] });
      pos += codeMatch[0].length;
      continue;
    }

    // 链接 [text](url)
    const linkMatch = matchAt(raw, pos, /^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      nodes.push({
        type: 'link',
        href: linkMatch[2],
        children: parseInline(linkMatch[1]),
      });
      pos += linkMatch[0].length;
      continue;
    }

    // 图片 ![alt](url) — 暂不单独映射，作为特殊链接打入 text
    const imgMatch = matchAt(raw, pos, /^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      nodes.push({ type: 'text', content: imgMatch[0] });
      pos += imgMatch[0].length;
      continue;
    }

    // 粗体 **...**
    const strongMatch = matchAt(raw, pos, /^\*\*(.+?)\*\*/);
    if (strongMatch) {
      nodes.push({
        type: 'strong',
        children: parseInline(strongMatch[1]),
      });
      pos += strongMatch[0].length;
      continue;
    }

    // 删除线 ~~...~~
    const delMatch = matchAt(raw, pos, /^~~(.+?)~~/);
    if (delMatch) {
      nodes.push({
        type: 'del',
        children: parseInline(delMatch[1]),
      });
      pos += delMatch[0].length;
      continue;
    }

    // 斜体 *...* (单星号，不和双星号冲突因为上面已经处理了**)
    const emMatch = matchAt(raw, pos, /^\*(.+?)\*/);
    if (emMatch) {
      nodes.push({
        type: 'em',
        children: parseInline(emMatch[1]),
      });
      pos += emMatch[0].length;
      continue;
    }

    // <br>
    if (raw.slice(pos).startsWith('<br>') || raw.slice(pos).startsWith('<br/>')) {
      const len = raw.slice(pos).startsWith('<br/>') ? 5 : 4;
      nodes.push({ type: 'br' });
      pos += len;
      continue;
    }

    // 普通文本：一直取到下一个特殊字符
    const nextSpecial = raw.slice(pos).search(/`|!?\[|\*\*?|~~|<br\/?>|<br>/);
    if (nextSpecial === -1) {
      // 剩余全部是纯文本
      const content = raw.slice(pos);
      if (content.length > 0) {
        nodes.push({ type: 'text', content });
      }
      break;
    }

    if (nextSpecial > 0) {
      nodes.push({ type: 'text', content: raw.slice(pos, pos + nextSpecial) });
      pos += nextSpecial;
      continue;
    }

    nodes.push({ type: 'text', content: raw[pos] });
    pos += 1;
  }

  return nodes;
}

// ---- 内部辅助 ----

/** 尝试在给定位置匹配正则，返回捕获组或 null */
function matchAt(
  raw: string,
  pos: number,
  re: RegExp,
): RegExpMatchArray | null {
  const slice = raw.slice(pos);
  const m = slice.match(re);
  return m;
}

/** 判断一行文本是否是一个新 block 的开始 */
function isBlockStart(line: string): boolean {
  return (
    /^#{1,6}\s/.test(line) ||
    /^```/.test(line) ||
    /^>\s?/.test(line) ||
    /^[\-\*]\s+\[[ xX]\]/.test(line) ||
    /^[\-\*\+]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^\|.*\|/.test(line) ||
    /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)
  );
}

/** 解析表格 */
function parseTable(
  lines: string[],
  start: number,
): { block: BlockNode; nextIndex: number } | null {
  // 表头行
  const headerCells = splitTableRow(lines[start]);
  // 分隔行 (| --- | --- |)
  const sepIndex = start + 1;
  if (sepIndex >= lines.length || !/^\|[\s\-:|]+\|/.test(lines[sepIndex])) {
    return null;
  }

  // 数据行
  const rows: TableCell[][] = [];
  let i = sepIndex + 1;
  while (i < lines.length && /^\|.*\|/.test(lines[i])) {
    rows.push(splitTableRow(lines[i]).map((cell) => parseInline(cell)));
    i++;
  }

  return {
    block: {
      type: 'table',
      header: headerCells.map((cell) => parseInline(cell)),
      rows,
    },
    nextIndex: i,
  };
}

/** 将 | a | b | c | 拆分成单元格字符串数组 */
function splitTableRow(line: string): string[] {
  return line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((s) => s.trim());
}
