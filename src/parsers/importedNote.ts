import type { ChapterDefinition, KnowledgePoint, StarTone } from '../types/knowledge';
import { parseNote } from './noteParser';
import { toKnowledgeNodes, type ParsedKnowledgeNode } from './toKnowledgeNodes';

export const MAX_IMPORT_CHARACTERS = 100_000;
export const MAX_IMPORT_NODES = 300;
export const MAX_IMPORT_FILE_BYTES = 200 * 1024;

const CHAPTER_TONES: StarTone[] = ['blue', 'cyan', 'violet', 'gold'];
const EMPTY_CONTENT_PLACEHOLDER = '笔记中该标题下暂无正文内容。';

export type NoteSourceKind = 'paste' | 'file';
export type NoteFileKind = 'markdown' | 'txt';

export interface ImportedNoteSummary {
  fileName: string;
  courseTitle: string;
  excerpt: string;
  characterCount: number;
  sourceKind: NoteSourceKind;
}

export interface ImportedKnowledgePoint extends KnowledgePoint {
  level: number;
}

export interface ImportedCourse {
  points: ImportedKnowledgePoint[];
  chapters: ChapterDefinition[];
  summary: ImportedNoteSummary;
}

export interface BuildImportedCourseOptions {
  fileName: string;
  sourceKind: NoteSourceKind;
}

export function getNoteFileKind(fileName: string): NoteFileKind | null {
  if (/\.(md|markdown)$/i.test(fileName)) return 'markdown';
  if (/\.txt$/i.test(fileName)) return 'txt';
  return null;
}

export function buildImportedCourse(
  text: string,
  { fileName, sourceKind }: BuildImportedCourseOptions,
): ImportedCourse {
  if (text.trim() === '') {
    throw new Error('请先粘贴笔记内容或选择 Markdown / TXT 文件。');
  }

  if (text.length > MAX_IMPORT_CHARACTERS) {
    throw new Error(
      `内容超过 ${MAX_IMPORT_CHARACTERS.toLocaleString('zh-CN')} 字符上限，请精简后再导入。`,
    );
  }

  const sections = parseNote(text);
  const mappedNodes = toKnowledgeNodes(sections);

  if (mappedNodes.length === 0) {
    throw new Error('没有识别到可导入的内容。');
  }

  if (mappedNodes.length > MAX_IMPORT_NODES) {
    throw new Error(
      `解析出 ${mappedNodes.length} 个知识点，超过单次导入上限 ${MAX_IMPORT_NODES} 个；请拆分笔记后再导入。`,
    );
  }

  const isSingleSection = mappedNodes.length === 1;
  const titledNodes = mappedNodes.map((node) => ({
    ...node,
    title:
      node.title.trim() ||
      (node.level === 0
        ? isSingleSection
          ? '笔记正文'
          : '开篇正文'
        : deriveTitleFromContent(node.content)),
  }));

  const nodeById = new Map(titledNodes.map((node) => [node.id, node]));
  const roots: ParsedKnowledgeNode[] = [];

  const findRoot = (node: ParsedKnowledgeNode): ParsedKnowledgeNode => {
    let current = node;
    const visited = new Set<string>();

    while (current.parentId && !visited.has(current.id)) {
      visited.add(current.id);
      const parent = nodeById.get(current.parentId);
      if (!parent) break;
      current = parent;
    }

    return current;
  };

  titledNodes.forEach((node) => {
    const root = findRoot(node);
    if (!roots.some((existing) => existing.id === root.id)) {
      roots.push(root);
    }
  });

  const chapters: ChapterDefinition[] = [];
  const chapterByRootId = new Map<string, ChapterDefinition>();

  roots.forEach((root, index) => {
    const chapter: ChapterDefinition = {
      id: `import-section-${index + 1}`,
      label: truncate(root.title, 18),
      caption: `SECTION ${String(index + 1).padStart(2, '0')}`,
      tone: CHAPTER_TONES[index % CHAPTER_TONES.length],
    };

    chapters.push(chapter);
    chapterByRootId.set(root.id, chapter);
  });

  const points: ImportedKnowledgePoint[] = titledNodes.map((node) => {
    const chapter = chapterByRootId.get(findRoot(node).id);

    if (!chapter) {
      throw new Error('解析结果缺少章节归属，请重试。');
    }

    return {
      id: node.id,
      title: node.title,
      content: node.content.trim() || EMPTY_CONTENT_PLACEHOLDER,
      parentId: node.parentId,
      scoreShare: null,
      mastery: null,
      estimatedMinutes: null,
      reviewed: false,
      position: node.position,
      chapterId: chapter.id,
      tone: chapter.tone,
      relatedIds: node.relatedIds,
      level: node.level,
    };
  });

  const headingTitle = titledNodes.find((node) => node.level === 1)?.title;
  const fileBaseName = fileName.replace(/\.[^.]+$/, '').trim();
  const firstContent = titledNodes.find((node) => node.content.trim())?.content ?? '';

  return {
    points,
    chapters,
    summary: {
      fileName,
      courseTitle: headingTitle || fileBaseName || '导入笔记',
      excerpt: truncate(collapseWhitespace(firstContent), 76) || '该笔记暂无正文摘要。',
      characterCount: text.length,
      sourceKind,
    },
  };
}

function deriveTitleFromContent(content: string) {
  const firstLine = content
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);

  const cleaned = (firstLine ?? '')
    .replace(/^#{1,6}\s+/, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/^>\s+/, '')
    .replace(/[*_`~]/g, '')
    .trim();

  return truncate(cleaned, 24) || '未命名知识点';
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function truncate(value: string, maxLength: number) {
  const characters = Array.from(value);
  return characters.length > maxLength
    ? `${characters.slice(0, maxLength).join('')}…`
    : value;
}
