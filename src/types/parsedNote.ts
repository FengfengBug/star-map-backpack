/**
 * 一条解析后的知识点草稿。
 * level 为 1–6 的 Markdown 标题层级；0 表示首个标题前的正文或全文无标题。
 * 无标题草稿的 title 为空字符串，parentTitle 为 null。
 */
export interface ParsedNoteSection {
  title: string;
  content: string;
  level: number;
  parentTitle: string | null;
}
