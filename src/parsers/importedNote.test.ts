import { describe, expect, it } from 'vitest';

import {
  MAX_IMPORT_CHARACTERS,
  MAX_IMPORT_NODES,
  buildImportedCourse,
  getNoteFileKind,
  type ImportedCourse,
} from './importedNote';

function build(text: string, fileName = '期末复习.md'): ImportedCourse {
  return buildImportedCourse(text, { fileName, sourceKind: 'file' });
}

describe('buildImportedCourse', () => {
  it('解析标题层级并生成章节、色调与待设置参数', () => {
    const course = build(
      [
        '# 计算机组成原理',
        '绪论。',
        '## 数据表示',
        '补码与浮点数。',
        '## 运算器',
        'ALU 与进位链。',
        '# 操作系统',
        '## 进程管理',
      ].join('\n'),
    );

    expect(course.points).toHaveLength(5);
    expect(course.chapters).toHaveLength(2);
    expect(course.chapters.map(({ id, label, caption, tone }) => ({ id, label, caption, tone }))).toEqual([
      { id: 'import-section-1', label: '计算机组成原理', caption: 'SECTION 01', tone: 'blue' },
      { id: 'import-section-2', label: '操作系统', caption: 'SECTION 02', tone: 'cyan' },
    ]);
    expect(
      course.points.map(({ title, parentId, chapterId, tone, level, scoreShare, mastery, estimatedMinutes, reviewed }) => ({
        title,
        parentId,
        chapterId,
        tone,
        level,
        scoreShare,
        mastery,
        estimatedMinutes,
        reviewed,
      })),
    ).toEqual([
      {
        title: '计算机组成原理',
        parentId: null,
        chapterId: 'import-section-1',
        tone: 'blue',
        level: 1,
        scoreShare: null,
        mastery: null,
        estimatedMinutes: null,
        reviewed: false,
      },
      {
        title: '数据表示',
        parentId: 'note-1',
        chapterId: 'import-section-1',
        tone: 'blue',
        level: 2,
        scoreShare: null,
        mastery: null,
        estimatedMinutes: null,
        reviewed: false,
      },
      {
        title: '运算器',
        parentId: 'note-1',
        chapterId: 'import-section-1',
        tone: 'blue',
        level: 2,
        scoreShare: null,
        mastery: null,
        estimatedMinutes: null,
        reviewed: false,
      },
      {
        title: '操作系统',
        parentId: null,
        chapterId: 'import-section-2',
        tone: 'cyan',
        level: 1,
        scoreShare: null,
        mastery: null,
        estimatedMinutes: null,
        reviewed: false,
      },
      {
        title: '进程管理',
        parentId: 'note-4',
        chapterId: 'import-section-2',
        tone: 'cyan',
        level: 2,
        scoreShare: null,
        mastery: null,
        estimatedMinutes: null,
        reviewed: false,
      },
    ]);
    expect(course.points[1].relatedIds).toEqual(['note-3']);
    expect(course.summary.courseTitle).toBe('计算机组成原理');
    expect(course.summary.excerpt).toBe('绪论。');
    expect(course.summary.characterCount).toBeGreaterThan(0);
  });

  it('无标题文本生成单个正文节点与单个章节', () => {
    const course = build('这是一段没有标题的正文。\n\n仍然属于同一段。', '随手笔记.txt');

    expect(course.points).toHaveLength(1);
    expect(course.points[0]).toMatchObject({
      title: '笔记正文',
      parentId: null,
      level: 0,
      relatedIds: [],
      scoreShare: null,
      mastery: null,
      estimatedMinutes: null,
    });
    expect(course.chapters).toHaveLength(1);
    expect(course.summary.courseTitle).toBe('随手笔记');
  });

  it('标题前的正文使用开篇正文标题，后续标题仍独立成章', () => {
    const course = build('开篇说明。\n\n# 第一章\n\n## 第一节');

    expect(course.points[0]).toMatchObject({ title: '开篇正文', level: 0, parentId: null });
    expect(course.points[1]).toMatchObject({ title: '第一章', level: 1, parentId: null });
    expect(course.points[1].relatedIds).toEqual([]);
    expect(course.chapters).toHaveLength(2);
    expect(course.summary.courseTitle).toBe('第一章');
  });

  it('空内容与超长内容给出明确错误', () => {
    expect(() => build('   \n  ')).toThrow('请先粘贴笔记内容');
    expect(() => build('a'.repeat(MAX_IMPORT_CHARACTERS + 1))).toThrow('字符上限');
  });

  it('超过知识点上限时拒绝导入', () => {
    const text = Array.from({ length: MAX_IMPORT_NODES + 1 }, (_, index) => `# 节点 ${index + 1}`).join(
      '\n',
    );

    expect(() => build(text)).toThrow(`超过单次导入上限 ${MAX_IMPORT_NODES} 个`);
  });

  it('为没有正文的标题补充占位摘要', () => {
    const course = build('# 只有标题');

    expect(course.points[0].content).toBe('笔记中该标题下暂无正文内容。');
  });
});

describe('getNoteFileKind', () => {
  it('仅接受 Markdown 与 TXT 扩展名', () => {
    expect(getNoteFileKind('笔记.md')).toBe('markdown');
    expect(getNoteFileKind('笔记.MARKDOWN')).toBe('markdown');
    expect(getNoteFileKind('笔记.txt')).toBe('txt');
    expect(getNoteFileKind('笔记.TXT')).toBe('txt');
    expect(getNoteFileKind('笔记.pdf')).toBeNull();
    expect(getNoteFileKind('笔记')).toBeNull();
  });
});
