import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ChapterDefinition, KnowledgeFlowNode } from '../types/knowledge';
import { DetailPanel } from './DetailPanel';

const noop = () => {};

const chapter: ChapterDefinition = {
  id: 'trees',
  label: '第 3 章 · 树与二叉树',
  caption: '递归结构',
  tone: 'blue',
};

function createNode(reviewed: boolean): KnowledgeFlowNode {
  return {
    id: 'binary-tree',
    type: 'knowledge',
    position: { x: 0, y: 0 },
    data: {
      title: '二叉树的遍历',
      content: '前序、中序、后序遍历的访问顺序与递归实现。',
      parentId: null,
      scoreShare: 9,
      mastery: 65,
      estimatedMinutes: 18,
      reviewed,
      chapterId: chapter.id,
      tone: 'blue',
      relatedIds: [],
      routeState: null,
    },
  };
}

function renderDetail(reviewed: boolean) {
  return renderToStaticMarkup(
    <DetailPanel
      node={createNode(reviewed)}
      chapter={chapter}
      parentNode={null}
      relatedNodes={[]}
      onSelectNode={noop}
      onClearSelection={noop}
      onSaveNode={noop}
      onToggleReviewed={noop}
      onPreviewNode={noop}
    />,
  );
}

describe('DetailPanel review state', () => {
  it('待复习时提供标记入口，并说明不会自动修改掌握度', () => {
    const html = renderDetail(false);

    expect(html).toContain('本轮复习');
    expect(html).toContain('完成这颗知识星');
    expect(html).toContain('标记为已复习');
    expect(html).toContain('保持 65%');
    expect(html).toContain('不会被自动修改');
    expect(html).toContain('调整');
    expect(html).not.toContain('撤销已复习');
    expect(html).not.toContain('快速调整掌握度');
  });

  it('已复习时可撤销标记，并保留掌握度说明', () => {
    const html = renderDetail(true);

    expect(html).toContain('已在复习记录中');
    expect(html).toContain('撤销已复习');
    expect(html).toContain('可随时撤销');
    expect(html).toContain('保持 65%');
    expect(html).toContain('不会被自动修改');
    expect(html).not.toContain('标记为已复习');
  });
});
