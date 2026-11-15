import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { KnowledgeGraph } from './KnowledgeGraph';

const noop = () => {};

describe('KnowledgeGraph empty state', () => {
  it('无知识点时展示真实入口并隐藏无效布局操作', () => {
    const html = renderToStaticMarkup(
      <KnowledgeGraph
        nodes={[]}
        edges={[]}
        onNodesChange={noop}
        onSelectNode={noop}
        onNodeDragStop={noop}
        onResetLayout={noop}
        onOpenImport={noop}
        onLoadSample={noop}
      />,
    );

    expect(html).toContain('还没有知识点');
    expect(html).toContain('导入笔记');
    expect(html).toContain('载入示例');
    expect(html).toContain('暂无布局可恢复');
    expect(html).not.toContain('恢复布局');
    expect(html).not.toContain('位置自动保存');
    expect(html).not.toContain('graph-legend');
  });
});
