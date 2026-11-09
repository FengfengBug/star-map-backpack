import { describe, expect, it } from 'vitest';

import { parseNote } from './noteParser';
import { buildRelatedEdges, toKnowledgeNodes } from './toKnowledgeNodes';
import type { ParsedKnowledgeNode } from './toKnowledgeNodes';

function createNode(id: string, relatedIds: string[] = []): ParsedKnowledgeNode {
  return {
    id,
    title: id,
    content: '',
    parentId: null,
    relatedIds,
    level: 1,
    position: { x: 0, y: 0 },
  };
}

describe('toKnowledgeNodes', () => {
  it('按标题层级生成 id、parentId、内容与层级', () => {
    const nodes = toKnowledgeNodes(
      parseNote(
        [
          '# 计算机组成原理',
          '绪论。',
          '## 数据表示',
          '### 定点数',
          '补码。',
          '## 运算器',
          '# 操作系统',
          '## 进程管理',
        ].join('\n'),
      ),
    );

    expect(
      nodes.map(({ id, title, parentId, level, content }) => ({
        id,
        title,
        parentId,
        level,
        content,
      })),
    ).toEqual([
      { id: 'note-1', title: '计算机组成原理', parentId: null, level: 1, content: '绪论。' },
      { id: 'note-2', title: '数据表示', parentId: 'note-1', level: 2, content: '' },
      { id: 'note-3', title: '定点数', parentId: 'note-2', level: 3, content: '补码。' },
      { id: 'note-4', title: '运算器', parentId: 'note-1', level: 2, content: '' },
      { id: 'note-5', title: '操作系统', parentId: null, level: 1, content: '' },
      { id: 'note-6', title: '进程管理', parentId: 'note-5', level: 2, content: '' },
    ]);
    expect(nodes.every((node) => node.position.x >= 0 && node.position.y >= 0)).toBe(true);
  });

  it('为同级相邻节点生成关联边并按无序端点去重', () => {
    const nodes = toKnowledgeNodes(
      parseNote(['# 主题', '## 概念一', '## 概念二', '## 概念三'].join('\n')),
    );

    const edges = buildRelatedEdges(nodes);

    expect(edges).toEqual([
      { id: 'related:note-2:note-3', source: 'note-2', target: 'note-3', relation: 'related' },
      { id: 'related:note-3:note-4', source: 'note-3', target: 'note-4', relation: 'related' },
    ]);
    expect(nodes[1].relatedIds).toEqual(['note-3']);
    expect(nodes[2].relatedIds).toEqual(['note-2', 'note-4']);
    expect(nodes[3].relatedIds).toEqual(['note-3']);
    expect(new Set(edges.map((edge) => `${edge.source}|${edge.target}`)).size).toBe(edges.length);
  });

  it('无标题文本生成单个根节点且不产生关联边', () => {
    const nodes = toKnowledgeNodes(parseNote('这是一段没有标题的正文。\n\n仍然属于同一段。'));

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      id: 'note-1',
      title: '',
      content: '这是一段没有标题的正文。\n\n仍然属于同一段。',
      parentId: null,
      level: 0,
      relatedIds: [],
    });
    expect(buildRelatedEdges(nodes)).toEqual([]);
  });

  it('标题前的无标题正文作为根节点，不成为后续标题的父级', () => {
    const nodes = toKnowledgeNodes(parseNote('开篇说明。\n\n# 第一章\n\n# 第二章'));

    expect(nodes[0]).toMatchObject({ title: '', parentId: null, level: 0 });
    expect(nodes[1]).toMatchObject({ title: '第一章', parentId: null, level: 1 });
    expect(nodes[2]).toMatchObject({ title: '第二章', parentId: null, level: 1 });
    expect(buildRelatedEdges(nodes)).toHaveLength(1);
    expect(nodes[1].relatedIds).toEqual(['note-3']);
  });

  it('使用确定性树形布局并让父节点位于子节点上方', () => {
    const sections = parseNote(
      ['# 根', '## 左', '### 左一', '### 左二', '## 右'].join('\n'),
    );

    const first = toKnowledgeNodes(sections);
    const second = toKnowledgeNodes(sections);

    expect(second).toEqual(first);
    expect(first[1].position.y).toBeGreaterThan(first[0].position.y);
    expect(first[2].position.y).toBeGreaterThan(first[1].position.y);
    expect(first[3].position.y).toBe(first[2].position.y);
    expect(first[0].position.x).toBeGreaterThan(first[1].position.x);
    expect(first[0].position.x).toBeLessThan(first[4].position.x);
  });

  it('不生成分值、掌握度或时间字段', () => {
    const [node] = toKnowledgeNodes(parseNote('# 标题'));

    expect(node).not.toHaveProperty('scoreShare');
    expect(node).not.toHaveProperty('mastery');
    expect(node).not.toHaveProperty('estimatedMinutes');
  });
});

describe('buildRelatedEdges', () => {
  it('对双向、重复、未知和自引用端点做无序去重', () => {
    const nodes = [
      createNode('a', ['b', 'b', 'c', 'missing', 'a']),
      createNode('b', ['a']),
      createNode('c', ['a', 'b']),
    ];

    expect(buildRelatedEdges(nodes)).toEqual([
      { id: 'related:a:b', source: 'a', target: 'b', relation: 'related' },
      { id: 'related:a:c', source: 'a', target: 'c', relation: 'related' },
      { id: 'related:b:c', source: 'b', target: 'c', relation: 'related' },
    ]);
  });
});
