// Origin: commercial 2026-10-12 utils/markdown/types.ts
// Markdown AST 类型定义
// 对应 otherone-md 渲染体系中的所有节点类型

/** 行内节点的联合类型 */
export type InlineNode =
  | { type: 'text'; content: string }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'em'; children: InlineNode[] }
  | { type: 'del'; children: InlineNode[] }
  | { type: 'codespan'; content: string }
  | { type: 'link'; href: string; children: InlineNode[] }
  | { type: 'br' };

/** 表格单元格内容 */
export type TableCell = InlineNode[];

/** 列表项 */
export type ListItem = {
  children: BlockNode[];
};

/** 任务列表项 */
export type TaskItem = {
  checked: boolean;
  children: InlineNode[];
};

/** 块级节点的联合类型 */
export type BlockNode =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: 'code_block'; lang: string; code: string }
  | { type: 'blockquote'; children: BlockNode[] }
  | { type: 'list'; ordered: boolean; items: ListItem[] }
  | { type: 'task_list'; items: TaskItem[] }
  | { type: 'table'; header: TableCell[]; rows: TableCell[][] }
  | { type: 'hr' };

/** 解析结果：一组块级节点 */
export type MarkdownAST = BlockNode[];
