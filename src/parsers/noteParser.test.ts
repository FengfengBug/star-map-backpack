import { describe, expect, it } from 'vitest';

import { parseNote } from './noteParser';

describe('parseNote', () => {
  it('空文本或纯空白文本返回空数组', () => {
    expect(parseNote('')).toEqual([]);
    expect(parseNote('   \n\n\t')).toEqual([]);
  });

  it('无标题段落返回单条 level 0 草稿并保留段落分隔', () => {
    const sections = parseNote('第一段内容。\n\n第二段内容。');

    expect(sections).toEqual([
      {
        title: '',
        content: '第一段内容。\n\n第二段内容。',
        level: 0,
        parentTitle: null,
      },
    ]);
  });

  it('按标题层级生成 title、level 与 parentTitle', () => {
    const sections = parseNote(
      [
        '# 计算机组成原理',
        '绪论段落。',
        '## 数据表示',
        '### 定点数',
        '补码与移码。',
        '## 运算器 ##',
        '### 加法器',
        '- 半加器',
        '- 全加器',
      ].join('\n'),
    );

    expect(
      sections.map(({ title, level, parentTitle }) => ({ title, level, parentTitle })),
    ).toEqual([
      { title: '计算机组成原理', level: 1, parentTitle: null },
      { title: '数据表示', level: 2, parentTitle: '计算机组成原理' },
      { title: '定点数', level: 3, parentTitle: '数据表示' },
      { title: '运算器', level: 2, parentTitle: '计算机组成原理' },
      { title: '加法器', level: 3, parentTitle: '运算器' },
    ]);
    expect(sections[0].content).toBe('绪论段落。');
    expect(sections[1].content).toBe('');
    expect(sections[2].content).toBe('补码与移码。');
    expect(sections[3].content).toBe('');
    expect(sections[4].content).toBe('- 半加器\n- 全加器');
  });

  it('保留有序与无序列表内容', () => {
    const sections = parseNote(
      [
        '# 线性结构',
        '- 顺序表',
        '- 链表',
        '  1. 单链表',
        '  2. 双链表',
        '',
        '## 栈',
        '1. 顺序栈',
        '2. 链栈',
      ].join('\n'),
    );

    expect(sections).toHaveLength(2);
    expect(sections[0].content).toBe('- 顺序表\n- 链表\n  1. 单链表\n  2. 双链表');
    expect(sections[1].content).toBe('1. 顺序栈\n2. 链栈');
  });

  it('标题前的正文作为独立草稿，不影响后续父子关系', () => {
    const sections = parseNote('开篇说明。\n\n# 主题\n正文。');

    expect(sections).toEqual([
      {
        title: '',
        content: '开篇说明。',
        level: 0,
        parentTitle: null,
      },
      {
        title: '主题',
        content: '正文。',
        level: 1,
        parentTitle: null,
      },
    ]);
  });

  it('代码块中的井号行不当作标题', () => {
    const sections = parseNote(
      ['# 示例', '```python', '# 这是注释', 'print("hi")', '```', '正文。'].join('\n'),
    );

    expect(sections).toEqual([
      {
        title: '示例',
        content: '```python\n# 这是注释\nprint("hi")\n```\n正文。',
        level: 1,
        parentTitle: null,
      },
    ]);
  });
});
