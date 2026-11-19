import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ReviewRoute } from './ReviewRoute';

const noop = () => {};

function renderEmptyRoute() {
  return renderToStaticMarkup(
    <ReviewRoute
      nodes={[]}
      courseTitle="数据结构与算法"
      isSampleData
      budgetMinutes={150}
      onBudgetChange={noop}
      animationEnabled
      onAnimationChange={noop}
      onGenerateRoute={noop}
      routeNodeCount={0}
      decisions={[]}
      routeSelectedIds={[]}
      totalBenefit={0}
      planChange={null}
      onUndoPlanChange={noop}
      onDismissPlanChange={noop}
      onLocateNode={noop}
      onOpenImport={noop}
      onLoadSample={noop}
    />,
  );
}

describe('ReviewRoute empty state', () => {
  it('无知识点时展示导入/示例引导，并解释禁用按钮', () => {
    const html = renderEmptyRoute();

    expect(html).toContain('等待知识点');
    expect(html).toContain('还没有可规划的航线');
    expect(html).toContain('导入笔记');
    expect(html).toContain('载入示例');
    expect(html).toContain('先导入或载入知识点，才能生成航线');
    expect(html).toContain('aria-describedby="route-action-hint"');
    expect(html).toContain('disabled=""');
  });

  it('无知识点时不渲染预算滑块与复习计数', () => {
    const html = renderEmptyRoute();

    expect(html).not.toContain('id="route-budget"');
    expect(html).not.toContain('route-reasons-trigger');
    expect(html).not.toContain('route-map__track');
  });
});
